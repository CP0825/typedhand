import { redirect } from "next/navigation";
import { EditorClient } from "@/components/editor/EditorClient";
import { getCurrentProfile } from "@/lib/profile";
import { getUserVariants, hasPendingApprovalFonts } from "@/lib/fonts/user-fonts";

export const metadata = { title: "Editor" };

export default async function EditorPage() {
  const profile = await getCurrentProfile();
  // Middleware already guards this route; this is a defensive fallback.
  if (!profile) redirect("/login");

  // The user's own APPROVED handwriting variants (with signed TTF URLs). When
  // present, the studio writes only with these; otherwise it uses the built-in
  // product handwriting (demo mode). Fonts that are ready but not yet approved
  // are deliberately excluded here and surfaced as "pending approval" instead.
  const userFonts = await getUserVariants(profile.id);
  const pendingApproval =
    userFonts.length === 0 && (await hasPendingApprovalFonts(profile.id));

  // EditorClient renders its own dark "studio" chrome (header + controls).
  return (
    <EditorClient
      tier={profile.tier}
      initialCount={profile.export_count}
      hasFonts={userFonts.length > 0}
      pendingApproval={pendingApproval}
      userFonts={userFonts}
    />
  );
}
