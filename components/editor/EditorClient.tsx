"use client";

import { useState } from "react";
import Link from "next/link";
import { HandwritingStudio, type BlockReason } from "./HandwritingStudio";
import { UpgradeModal } from "./UpgradeModal";
import { TierBadge } from "@/components/ui/Badge";
import { formatUsage } from "@/lib/tier-logic";
import { APP_NAME } from "@/lib/constants";
import type { Tier } from "@/lib/constants";
import type { UserVariant } from "./handwriting-engine";

interface EditorClientProps {
  tier: Tier;
  initialCount: number;
  hasFonts: boolean;
  /** True when the user has a ready font still awaiting approval (demo mode). */
  pendingApproval?: boolean;
  userFonts: UserVariant[];
}

export function EditorClient({
  tier,
  initialCount,
  hasFonts,
  pendingApproval = false,
  userFonts,
}: EditorClientProps) {
  const [count, setCount] = useState(initialCount);
  const [modalReason, setModalReason] = useState<BlockReason | null>(null);

  return (
    <div
      className="min-h-[100dvh] text-[#f0efe8]"
      style={{
        background:
          "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(124,106,255,0.12) 0%, transparent 70%), #0c0c0f",
      }}
    >
      {/* ── Studio header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0c0c0f]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#7c6aff] text-sm shadow-[0_0_16px_rgba(124,106,255,0.3)]">
              ✍
            </span>
            <span className="bg-gradient-to-r from-[#e8c96a] to-[#7c6aff] bg-clip-text text-sm font-bold tracking-wide text-transparent">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium tabular-nums text-white/45 sm:inline">
              {formatUsage(count, tier)}
            </span>
            <TierBadge tier={tier} />
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── The full index(3) studio ───────────────────────────────────── */}
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {!hasFonts && (
          <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-[#c9a84c]/30 bg-[#c9a84c]/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 rounded-md bg-[#c9a84c]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e8c96a]">
                {pendingApproval ? "Pending approval" : "Demo"}
              </span>
              <p className="text-sm leading-relaxed text-white/70">
                {pendingApproval ? (
                  <>
                    Your font is ready but not approved yet, so you&apos;re
                    writing with a demo style for now.{" "}
                    <span className="text-white/90">
                      Preview and approve it on your dashboard to start writing
                      with your own handwriting.
                    </span>
                  </>
                ) : (
                  <>
                    You&apos;re writing with a demo handwriting style so you can
                    try it right away.{" "}
                    <span className="text-white/90">
                      Upload your own handwriting to make every letter truly
                      yours.
                    </span>
                  </>
                )}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#7c6aff] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(124,106,255,0.25)] transition-opacity hover:opacity-90"
            >
              {pendingApproval ? "Review & approve" : "Personalize it"}
            </Link>
          </div>
        )}
        <HandwritingStudio
          hasFonts={hasFonts}
          isDemo={!hasFonts}
          userFonts={userFonts}
          onBlocked={(reason) => setModalReason(reason)}
          onExported={() => {
            // Local count bump only — a router.refresh() here can drop the
            // page stylesheet in dev (App Router FOUC bug). The dashboard
            // re-reads usage + saved exports when navigated to.
            setCount((c) => c + 1);
          }}
        />
      </div>

      <UpgradeModal
        open={modalReason !== null}
        onClose={() => setModalReason(null)}
        reason={modalReason ?? "limit_reached"}
      />
    </div>
  );
}
