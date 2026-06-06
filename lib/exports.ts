import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Lists a user's saved PDF exports (newest first) with short-lived signed URLs.
// Read-only: the dashboard only ever links to these; there is no edit path.
const BUCKET = "exports";
const SIGN_TTL = 60 * 60 * 6; // 6h — covers a dashboard session

export interface ExportFile {
  name: string;
  path: string;
  url: string;
  created_at: string | null;
  size: number | null;
}

export async function getUserExports(userId: string): Promise<ExportFile[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .list(userId, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error || !data) return [];

  const out: ExportFile[] = [];
  for (const f of data) {
    if (!f.name.toLowerCase().endsWith(".pdf")) continue;
    const path = `${userId}/${f.name}`;
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGN_TTL);
    if (signed?.signedUrl) {
      out.push({
        name: f.name,
        path,
        url: signed.signedUrl,
        created_at: f.created_at ?? null,
        size: (f.metadata?.size as number | undefined) ?? null,
      });
    }
  }
  return out;
}
