"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// DSGVO self-service: export (Art. 15/20) and delete (Art. 17). Export is a
// plain authenticated download link; delete is a destructive POST behind an
// explicit confirm step, after which we sign the user out.
export function AccountDataActions() {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Could not delete your account.");
      }
      await supabase.auth.signOut().catch(() => {});
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your account.");
      setDeleting(false);
    }
  }

  return (
    <div className="th-card mt-6">
      <h2 className="text-base font-semibold text-th-editor-text">Your data &amp; privacy</h2>
      <p className="mt-1 max-w-xl text-sm text-th-editor-muted">
        Download everything we hold about you, or permanently delete your account
        and all your data.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="/api/account/export"
          download
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-th-editor-border px-3.5 text-sm font-medium text-th-editor-text transition-colors hover:bg-th-surface-2"
        >
          ⬇ Export my data
        </a>

        {!confirming && (
          <Button
            variant="dark-ghost"
            onClick={() => setConfirming(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Delete account
          </Button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-medium text-red-700">
            Permanently delete your account?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-600/90">
            This removes your account, your uploaded handwriting sheets, your
            generated fonts, and all saved PDF exports. This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button
              variant="danger"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button
              variant="dark-ghost"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
