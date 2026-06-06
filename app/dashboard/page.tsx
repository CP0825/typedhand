import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TierBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { FontManager } from "@/components/dashboard/FontManager";
import { ExportHistory } from "@/components/dashboard/ExportHistory";
import { AccountDataActions } from "@/components/dashboard/AccountDataActions";
import { getCurrentProfile } from "@/lib/profile";
import { getUserFonts } from "@/lib/fonts/user-fonts";
import { getRecentFontJobs } from "@/lib/fonts/jobs";
import { getWorkerHealth } from "@/lib/worker-health";
import { getUserExports } from "@/lib/exports";
import { formatUsage, getFontLimit } from "@/lib/tier-logic";
import { PRICING } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

function UpgradedNotice({ upgraded }: { upgraded?: string }) {
  if (upgraded !== "true") return null;
  return (
    <div className="mb-6 rounded-xl border border-terracotta/25 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">
      🎉 Your upgrade is being processed. Your new plan will appear here within
      a few seconds — refresh if it hasn&apos;t updated.
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const fonts = await getUserFonts(profile.id);
  const jobs = await getRecentFontJobs(profile.id);
  const worker = await getWorkerHealth();
  const exports = await getUserExports(profile.id);
  const fontLimit = getFontLimit(profile.tier);
  const limit = PRICING[profile.tier].exportLimit;
  const resetDate = new Date(profile.export_reset_date).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-content px-5 py-10">
        <UpgradedNotice upgraded={upgraded} />

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">Your account</h1>
          <TierBadge tier={profile.tier} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
            <p className="text-sm font-medium text-ink/50">Exports this month</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">
              {formatUsage(profile.export_count, profile.tier)}
            </p>
            <p className="mt-2 text-sm text-ink/55">
              {limit === Infinity
                ? "Unlimited exports on your plan."
                : `Resets on ${resetDate}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
            <p className="text-sm font-medium text-ink/50">Signed in as</p>
            <p className="mt-2 truncate text-lg font-medium text-ink">
              {profile.email}
            </p>
            <p className="mt-2 text-sm text-ink/55">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-ink">Your plan</h2>
          <p className="mb-5 mt-1 text-sm text-ink/55">
            {profile.tier === "free" &&
              "You're on Free — 1 watermarked PDF export a month. Upgrade for more exports and no watermark."}
            {profile.tier === "student" &&
              "You're on Student — 5 watermark-free single-page PDF exports a month."}
            {profile.tier === "pro" &&
              "You're on Pro — unlimited multi-page PDF exports, no watermark."}
          </p>
          <DashboardActions tier={profile.tier} />
        </div>

        <FontManager
          userId={profile.id}
          tier={profile.tier}
          limit={fontLimit}
          initialFonts={fonts}
          initialJobs={jobs}
          workerHealthy={worker.healthy}
        />

        <ExportHistory exports={exports} />

        <AccountDataActions />

        <div className="mt-6">
          <LinkButton href="/editor" variant="ghost" size="sm">
            ← Back to the editor
          </LinkButton>
        </div>
      </main>
      <Footer />
    </>
  );
}
