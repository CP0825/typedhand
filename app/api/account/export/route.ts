import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DSGVO Art. 15 / 20 — "Export my data". Returns a single JSON download with the
// user's account data and short-lived signed links to every file we hold for
// them (uploaded handwriting sheets, generated fonts, exported PDFs).
const FONT_BUCKET = "personal-fonts";
const EXPORT_BUCKET = "exports";
const SIGN_TTL = 60 * 60; // 1h

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const uid = user.id;

  const [{ data: profile }, { data: fonts }, { data: jobs }, { data: exportLog }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", uid).single(),
      admin.from("user_fonts").select("*").eq("user_id", uid),
      admin.from("font_jobs").select("*").eq("user_id", uid),
      admin.from("exports").select("*").eq("user_id", uid),
    ]);

  // Sign every stored file so the export is genuinely portable.
  async function sign(bucket: string, path: string | null) {
    if (!path) return null;
    const { data } = await admin.storage.from(bucket).createSignedUrl(path, SIGN_TTL);
    return data?.signedUrl ?? null;
  }

  const fontFiles: Array<Record<string, unknown>> = [];
  for (const f of fonts ?? []) {
    fontFiles.push({
      name: f.name,
      source_pdf: await sign(FONT_BUCKET, f.source_path),
      font_ttf: await sign(FONT_BUCKET, f.font_path),
    });
  }

  const exportFiles: Array<Record<string, unknown>> = [];
  const { data: exObjects } = await admin.storage.from(EXPORT_BUCKET).list(uid, {
    limit: 1000,
  });
  for (const o of exObjects ?? []) {
    if (!o.name.toLowerCase().endsWith(".pdf")) continue;
    exportFiles.push({ name: o.name, url: await sign(EXPORT_BUCKET, `${uid}/${o.name}`) });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    note:
      "Signed file links are valid for ~1 hour. Download them before they expire.",
    account: profile,
    handwriting_fonts: fonts,
    font_jobs: jobs,
    export_log: exportLog,
    files: { handwriting: fontFiles, exports: exportFiles },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="typedhand-data-export.json"`,
      "Cache-Control": "no-store",
    },
  });
}
