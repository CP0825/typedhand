import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// The worker upserts worker_status.last_seen_at on every poll (default every
// 5s). If we haven't heard from it within this window, treat it as down so the
// UI can say "processing delayed" instead of letting a job hang silently.
const STALE_AFTER_MS = 120_000; // 2 min

export interface WorkerHealth {
  healthy: boolean;
  lastSeen: string | null;
}

export async function getWorkerHealth(): Promise<WorkerHealth> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("worker_status")
      .select("last_seen_at")
      .eq("id", 1)
      .single<{ last_seen_at: string }>();
    if (!data?.last_seen_at) return { healthy: false, lastSeen: null };
    const age = Date.now() - new Date(data.last_seen_at).getTime();
    return { healthy: age <= STALE_AFTER_MS, lastSeen: data.last_seen_at };
  } catch {
    // No heartbeat row yet / migration not applied — don't block the UI.
    return { healthy: true, lastSeen: null };
  }
}
