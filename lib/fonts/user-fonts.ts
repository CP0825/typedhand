import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserFont } from "@/lib/types";
import type { UserVariant } from "@/components/editor/handwriting-engine";

const BUCKET = "personal-fonts";
const SIGN_TTL = 60 * 60 * 6; // 6h — comfortably covers an editing session

/**
 * Loads the signed-in user's uploaded handwriting fonts, newest first.
 * Returns [] when there is no session or the user has none.
 */
export async function getUserFonts(userId: string): Promise<UserFont[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_fonts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as UserFont[] | null) ?? [];
}

/** Stable, CSS-safe @font-face family name for a stored variant. */
export function variantFamily(fontId: string): string {
  return "UF_" + fontId.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Whether the user has a converted font that is ready but still awaiting their
 * approval (migration 007 `approved` column). The editor uses this to show a
 * "pending approval" hint while it falls back to demo mode for that font.
 */
export async function hasPendingApprovalFonts(userId: string): Promise<boolean> {
  const fonts = await getUserFonts(userId);
  return fonts.some((f) => f.status === "ready" && !f.approved);
}

/**
 * Builds the editor's UserVariant[] — every `ready` font with a usable glyph
 * set, paired with a short-lived signed URL to its TTF. The editor writes only
 * with these when present (built-ins are a per-character fallback).
 */
export async function getUserVariants(userId: string): Promise<UserVariant[]> {
  const fonts = await getUserFonts(userId);
  const usable = fonts.filter(
    (f) =>
      f.status === "ready" &&
      f.approved && // only fonts the user has previewed + approved
      f.font_path &&
      f.codepoints &&
      f.codepoints.length > 0,
  );
  if (usable.length === 0) return [];

  // Sign with the service role so it works regardless of session storage RLS.
  const admin = createAdminClient();
  const variants: UserVariant[] = [];
  for (const f of usable) {
    const { data } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(f.font_path as string, SIGN_TTL);
    if (data?.signedUrl) {
      variants.push({
        id: f.id,
        family: variantFamily(f.id),
        url: data.signedUrl,
        codepoints: f.codepoints as number[],
      });
    }
  }
  return variants;
}
