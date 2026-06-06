import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FontJob } from "@/lib/types";

/**
 * The user's most recent font-conversion jobs (newest first). Used to surface
 * queued / processing / failed status on the dashboard, including across page
 * reloads (the live poll only covers an in-flight upload). RLS scopes to owner.
 */
export async function getRecentFontJobs(
  userId: string,
  limit = 10,
): Promise<FontJob[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("font_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as FontJob[] | null) ?? [];
}
