import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DSGVO Art. 17 — "Delete my account + data". This MUST erase the actual files,
// not just the auth row:
//   1. Remove every storage object under the user (uploaded handwriting sheets
//      + generated TTFs in `personal-fonts`, and saved PDFs in `exports`).
//   2. Delete the auth user, which cascades to profiles and (via ON DELETE
//      CASCADE) to user_fonts, font_jobs and the exports audit table.
const FONT_BUCKET = "personal-fonts";
const EXPORT_BUCKET = "exports";

// Lists a storage folder and removes its files. (List is per-folder, not
// recursive, so callers pass each leaf folder.)
async function removeFolder(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
) {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!data || data.length === 0) return;
  const paths = data
    .filter((o) => o.name) // skip null/placeholder entries
    .map((o) => `${prefix}/${o.name}`);
  if (paths.length) await admin.storage.from(bucket).remove(paths);
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const uid = user.id;

  try {
    // 1. Storage — known layouts: personal-fonts/<uid>/{sources,fonts}/*,
    //    exports/<uid>/*. Also sweep the user root in each bucket for safety.
    await removeFolder(admin, FONT_BUCKET, `${uid}/sources`);
    await removeFolder(admin, FONT_BUCKET, `${uid}/fonts`);
    await removeFolder(admin, FONT_BUCKET, uid);
    await removeFolder(admin, EXPORT_BUCKET, uid);

    // 2. Auth user → cascades profiles → user_fonts, font_jobs, exports.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw new Error(delErr.message);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deletion failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
