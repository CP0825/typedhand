import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Persists a finished PDF export under the user's profile so they can re-open
// and re-download it later from the dashboard. The export accounting + tier gate
// already happened in /api/export; this route only stores the produced PDF (via
// the service role) and returns a short-lived signed URL the client opens in a
// new tab. Saved exports are read-only — there is no update/delete path here.
const BUCKET = "exports";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — a high-res multi-page PDF

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be between 1 byte and 50 MB." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // Timestamp prefix keeps the dashboard list ordered + human-readable.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `${user.id}/${stamp}__${randomUUID().slice(0, 8)}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (upErr) {
    return NextResponse.json(
      { error: "Could not save the export." },
      { status: 500 },
    );
  }

  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60); // 1h — enough to open in a new tab

  return NextResponse.json({ path, url: signed?.signedUrl ?? null });
}
