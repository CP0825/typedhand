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
    <div className="min-h-[100dvh] bg-th-canvas text-th-ink">
      {/* ── Studio header — same light chrome as the main navbar ─────────── */}
      <header className="sticky top-0 z-30 border-b border-th-dusty/50 bg-th-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-forest text-sm text-th-canvas">
              ✍
            </span>
            <span className="text-sm font-bold tracking-tight text-th-ink">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium tabular-nums text-th-ink-mid sm:inline">
              {formatUsage(count, tier)}
            </span>
            <TierBadge tier={tier} />
            <Link
              href="/dashboard"
              className="rounded-lg border border-th-dusty/70 px-3 py-1.5 text-xs font-medium text-th-ink-mid transition-colors hover:border-th-ink/30 hover:text-th-ink"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── The full index(3) studio ───────────────────────────────────── */}
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {!hasFonts && (
          <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-th-amber/30 bg-th-amber/8 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 rounded-md bg-th-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-th-amber">
                {pendingApproval ? "Pending approval" : "Demo"}
              </span>
              <p className="text-sm leading-relaxed text-th-editor-muted">
                {pendingApproval ? (
                  <>
                    Your font is ready but not approved yet, so you&apos;re
                    writing with a demo style for now.{" "}
                    <span className="text-th-editor-text">
                      Preview and approve it on your dashboard to start writing
                      with your own handwriting.
                    </span>
                  </>
                ) : (
                  <>
                    You&apos;re writing with a demo handwriting style so you can
                    try it right away.{" "}
                    <span className="text-th-editor-text">
                      Upload your own handwriting to make every letter truly
                      yours.
                    </span>
                  </>
                )}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl bg-th-amber px-4 py-2 text-sm font-semibold text-th-void transition-opacity hover:opacity-90"
            >
              {pendingApproval ? "Review & approve" : "Personalize it"}
            </Link>
          </div>
        )}
        <HandwritingStudio
          tier={tier}
          hasFonts={hasFonts}
          isDemo={!hasFonts}
          userFonts={userFonts}
          onBlocked={(reason) => setModalReason(reason)}
          onExported={() => {
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
