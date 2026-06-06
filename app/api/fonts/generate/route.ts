import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFontLimit } from "@/lib/tier-logic";
import { getTemplate, canUseTemplate } from "@/lib/templates";
import type { Profile } from "@/lib/types";

// "Generate my font" enqueue endpoint.
//
// The actual PDF -> TTF conversion needs heavy native tooling (potrace,
// fontforge, PyMuPDF, opencv) and takes seconds per sheet, so it CANNOT run in
// a serverless function. This route only:
//   1. Re-validates the session and the Pro tier (authoritative gate).
//   2. Enforces the per-tier font limit.
//   3. Validates + uploads the PDF(s) to the personal-fonts bucket.
//   4. Inserts one queued font_jobs row.
// The polling worker container (font-worker/worker.py) does the conversion and
// writes the resulting user_fonts rows. The client polls GET ?jobId=... for
// status (or queries font_jobs directly via its own session).

const BUCKET = "personal-fonts";
const MAX_FILES = 10; // also bounded by the tier font limit below
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per PDF — clean templates are small

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not load your account." },
      { status: 500 },
    );
  }

  // Parse the multipart upload.
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  // The user picks one of the issued templates per upload. Validate it against
  // the tier (Spanish/French are Pro-only; free gets template 3 only).
  const rawTemplate = form.get("template");
  const templateId = typeof rawTemplate === "string" ? rawTemplate : "";
  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Pick a template to upload." },
      { status: 400 },
    );
  }
  if (!canUseTemplate(profile.tier, templateId)) {
    return NextResponse.json(
      {
        error: "That template isn’t available on your plan.",
        reason: "template_not_allowed",
      },
      { status: 403 },
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const rawName = form.get("name");
  const name =
    (typeof rawName === "string" && rawName.trim()) || "My handwriting";

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one filled template PDF." },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Upload at most ${MAX_FILES} sheets at once.` },
      { status: 400 },
    );
  }

  for (const f of files) {
    // The iPad flow lets users export their filled template as a PDF or a
    // high-res PNG. Today the worker (convert.py) only opens PDFs, so we accept
    // PDF only and reject PNG with a clear error rather than enqueueing a job
    // that will fail.
    // TODO(worker): add PNG support — accept image/png here and handle PNG in
    // font-worker/convert.py, then update the dashboard guide accordingly.
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        {
          error: `"${f.name}" must be a PDF. PNG upload isn't supported yet — please export your sheet as a PDF.`,
        },
        { status: 400 },
      );
    }
    if (f.size === 0 || f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${f.name}" must be between 1 byte and 20 MB.` },
        { status: 400 },
      );
    }
  }

  // Enforce the per-tier font limit: each PDF produces one variant.
  const fontLimit = getFontLimit(profile.tier);
  const { count: existing } = await admin
    .from("user_fonts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((existing ?? 0) + files.length > fontLimit) {
    return NextResponse.json(
      {
        error: `That would exceed your ${fontLimit}-font limit (you have ${existing ?? 0}).`,
        reason: "font_limit",
      },
      { status: 403 },
    );
  }

  // Upload each PDF to <user_id>/sources/<uuid>.pdf via the service role.
  const sourcePaths: string[] = [];
  for (const f of files) {
    const path = `${user.id}/sources/${randomUUID()}.pdf`;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      // Roll back anything already uploaded so we don't orphan files.
      if (sourcePaths.length) {
        await admin.storage.from(BUCKET).remove(sourcePaths);
      }
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 },
      );
    }
    sourcePaths.push(path);
  }

  // Enqueue the job.
  const { data: job, error: jobErr } = await admin
    .from("font_jobs")
    .insert({
      user_id: user.id,
      name,
      status: "queued",
      source_paths: sourcePaths,
      template: template.layout,
    })
    .select("id, status")
    .single();

  if (jobErr || !job) {
    await admin.storage.from(BUCKET).remove(sourcePaths);
    return NextResponse.json(
      { error: "Could not start the job. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
}

// Status polling. The client may also query font_jobs directly (owner SELECT
// RLS), but this keeps the contract simple.
export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // RLS restricts this to the owner's own jobs.
  const { data: job, error } = await supabase
    .from("font_jobs")
    .select("id, status, name, font_ids, error, created_at, finished_at")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  // Surface worker liveness so the client can show "processing delayed" if the
  // converter has gone quiet while a job is still queued/processing.
  const { getWorkerHealth } = await import("@/lib/worker-health");
  const worker = await getWorkerHealth();

  return NextResponse.json({ job, workerHealthy: worker.healthy });
}
