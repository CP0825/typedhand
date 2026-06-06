import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResetDue, nextResetDate } from "@/lib/tier-logic";
import type { Profile } from "@/lib/types";

/**
 * Loads the signed-in user's profile, rolling over the monthly export counter
 * if the reset date has passed. Returns null when there is no session.
 *
 * The rollover uses the service-role client so the counter is authoritative
 * and consistent between display and export accounting.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  if (isResetDue(profile.export_reset_date)) {
    const admin = createAdminClient();
    const newReset = nextResetDate().toISOString();
    const { data: updated } = await admin
      .from("profiles")
      .update({ export_count: 0, export_reset_date: newReset })
      .eq("id", profile.id)
      .select("*")
      .single<Profile>();
    return updated ?? { ...profile, export_count: 0, export_reset_date: newReset };
  }

  return profile;
}
