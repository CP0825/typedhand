"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/constants";
import type { UserFont, FontJob } from "@/lib/types";
import {
  getTemplatesForTier,
  getTemplateByLayout,
  uploadRecommendation,
  type FontTemplate,
} from "@/lib/templates";
import { describeCoverage } from "@/lib/fonts/coverage";

// NOTE: The in-browser "write here" template editor (components/dashboard/
// TemplateWriter.tsx + lib/template-writer.ts) is intentionally NOT wired into
// the dashboard yet — it's a paused side-project. The files are kept so it can
// be revived later; nothing here references them.

interface FontManagerProps {
  userId: string;
  tier: Tier;
  limit: number;
  initialFonts: UserFont[];
  initialJobs: FontJob[];
  workerHealthy: boolean;
}

const BUCKET = "personal-fonts";
const ACCEPT = ".pdf,application/pdf";
const PREVIEW_TEXT = "abcdefghijklmnopqrstuvwxyz";

const STATUS_LABEL: Record<UserFont["status"], string> = {
  uploaded: "Queued…",
  processing: "Processing…",
  ready: "Ready",
  failed: "Failed",
};

const STATUS_TONE: Record<UserFont["status"], string> = {
  uploaded: "text-th-editor-muted",
  processing: "text-amber-600",
  ready: "text-green-600",
  failed: "text-red-600",
};

function FontPreview({ fontId, url }: { fontId: string; url: string }) {
  const [ready, setReady] = useState(false);
  const family = `PV_${fontId.replace(/[^a-zA-Z0-9]/g, "")}`;
  useEffect(() => {
    if (typeof FontFace === "undefined" || !document.fonts) return;
    const face = new FontFace(family, `url(${url})`, { display: "swap" });
    let cancelled = false;
    document.fonts.add(face);
    face
      .load()
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      try {
        document.fonts.delete(face);
      } catch {
        /* no-op */
      }
    };
  }, [family, url]);
  return (
    <div
      className="mt-2 rounded-lg border border-th-dusty bg-th-parchment px-3 py-2 text-2xl leading-snug text-th-ink"
      style={{ fontFamily: ready ? `'${family}', cursive` : "cursive" }}
    >
      {PREVIEW_TEXT}
    </div>
  );
}

export function FontManager({
  userId,
  tier,
  limit,
  initialFonts,
  initialJobs,
  workerHealthy,
}: FontManagerProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const templates = getTemplatesForTier(tier);
  const recommendation = uploadRecommendation(tier);

  const [fonts, setFonts] = useState<UserFont[]>(initialFonts);
  const [jobs, setJobs] = useState<FontJob[]>(initialJobs);
  const [workerOk, setWorkerOk] = useState(workerHealthy);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<FontTemplate>(templates[0]);
  const [generating, setGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const atLimit = fonts.length >= limit;

  const refreshFonts = useCallback(async () => {
    const { data } = await supabase
      .from("user_fonts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setFonts(data as UserFont[]);
  }, [supabase, userId]);

  const refreshJobs = useCallback(async () => {
    const { data } = await supabase
      .from("font_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setJobs(data as FontJob[]);
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const need = fonts.filter(
        (f) => f.status === "ready" && !f.approved && f.font_path && !previewUrls[f.id],
      );
      if (need.length === 0) return;
      const next: Record<string, string> = {};
      for (const f of need) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.font_path as string, 60 * 30);
        if (data?.signedUrl) next[f.id] = data.signedUrl;
      }
      if (!cancelled && Object.keys(next).length) {
        setPreviewUrls((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fonts, previewUrls, supabase]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  function poll(jobId: string) {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fonts/generate?jobId=${jobId}`);
        const data = await res.json();
        const status: string | undefined = data?.job?.status;
        setJobStatus(status ?? null);
        if (typeof data?.workerHealthy === "boolean") setWorkerOk(data.workerHealthy);
        if (status === "done") {
          await refreshFonts();
          await refreshJobs();
          setGenerating(false);
          setJobStatus(null);
          return;
        }
        if (status === "failed") {
          setError(data?.job?.error || "Generation failed. Please try again.");
          setGenerating(false);
          setJobStatus(null);
          await refreshJobs();
          return;
        }
        poll(jobId);
      } catch {
        poll(jobId);
      }
    }, 2500);
  }

  // Shared submit path for both the file upload and the in-browser writer.
  async function submitFiles(files: File[], template: FontTemplate = selected) {
    setError(null);
    if (files.length === 0) return;
    if (fonts.length + files.length > limit) {
      setError(
        `That would exceed your ${limit}-font limit (you have ${fonts.length}). Remove some or upload fewer sheets.`,
      );
      return;
    }
    for (const f of files) {
      const isPdf =
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError(`"${f.name}" is not a PDF.`);
        return;
      }
    }

    setGenerating(true);
    setJobStatus("queued");
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      const defaultName = `${template.label}: ${template.glyphs}`;
      form.append("name", name.trim() || defaultName);
      form.append("template", template.id);

      const res = await fetch("/api/fonts/generate", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not start generation.");
      }
      await refreshJobs();
      poll(data.jobId as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setGenerating(false);
      setJobStatus(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function reupload(job: FontJob) {
    const t = getTemplateByLayout(job.template);
    if (t) setSelected(t);
    setError(null);
    fileRef.current?.click();
  }

  async function onApprove(font: UserFont) {
    setError(null);
    setApproving(font.id);
    try {
      const { error: upErr } = await supabase
        .from("user_fonts")
        .update({ approved: true })
        .eq("id", font.id);
      if (upErr) throw new Error(upErr.message);
      setFonts((prev) =>
        prev.map((f) => (f.id === font.id ? { ...f, approved: true } : f)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve the font.");
    } finally {
      setApproving(null);
    }
  }

  async function onDelete(font: UserFont) {
    setError(null);
    setDeleting(font.id);
    try {
      const paths = [font.source_path, font.font_path].filter(
        (p): p is string => Boolean(p),
      );
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error: delErr } = await supabase
        .from("user_fonts")
        .delete()
        .eq("id", font.id);
      if (delErr) throw new Error(delErr.message);
      setFonts((prev) => prev.filter((f) => f.id !== font.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the font.");
    } finally {
      setDeleting(null);
    }
  }

  const openJobs = jobs.filter((j) => j.status !== "done");

  return (
    <div className="mt-6 rounded-2xl border border-th-editor-border bg-th-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-th-editor-text">
            Your own handwriting
          </h2>
          <p className="mt-1 max-w-xl text-sm text-th-editor-muted">
            Pick a template, fill it in on your iPad with Apple Pencil, then
            upload the exported file. We turn it into a font that writes in your
            own hand — no printer or scanner needed.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-th-surface-2 px-3 py-1 text-xs font-medium tabular-nums text-th-editor-muted">
          {fonts.length} / {limit} fonts
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* How-to guide */}
      <details className="group mt-4 rounded-xl border border-th-editor-border bg-th-surface-2 px-3.5 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-th-editor-text">
          How to make your font on iPad
          <span className="text-th-editor-muted transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-th-editor-muted">
          <li>Download the template PDF from TypedHand (below).</li>
          <li>Open it in Goodnotes, Notability, or Apple Files on iPad.</li>
          <li>Fill it in with Apple Pencil.</li>
          <li>Export it as a PDF from that app.</li>
          <li>Upload it to TypedHand.</li>
        </ol>
        <p className="mt-2 text-xs text-th-editor-muted">
          Upload a PDF — that&apos;s all you need. No printing or scanning.
        </p>
      </details>

      {/* Conversion job status */}
      {openJobs.length > 0 && (
        <ul className="mt-5 space-y-2">
          {openJobs.map((job) => {
            const processing =
              job.status === "queued" || job.status === "processing";
            return (
              <li
                key={job.id}
                className={`rounded-xl border px-3.5 py-3 text-sm ${
                  job.status === "failed"
                    ? "border-red-200 bg-red-50"
                    : "border-th-amber/25 bg-th-amber/8"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-th-editor-text">{job.name}</span>
                  <span
                    className={
                      job.status === "failed"
                        ? "text-xs font-medium text-red-700"
                        : "text-xs font-medium text-th-amber"
                    }
                  >
                    {job.status === "failed" ? "Failed" : "Processing…"}
                  </span>
                </div>
                {processing && (
                  <p className="mt-1 text-xs text-th-editor-muted">
                    {workerOk
                      ? "We're turning your sheet into a font — this usually takes under a minute. You can leave this page."
                      : "Processing is delayed — our converter is catching up. Your font will be ready shortly; no need to re-upload yet."}
                  </p>
                )}
                {job.status === "failed" && (
                  <div className="mt-1.5">
                    <p className="text-xs text-red-700">
                      {job.error || "Something went wrong converting that file."}
                    </p>
                    <Button
                      size="sm"
                      variant="dark-secondary"
                      className="mt-2"
                      onClick={() => reupload(job)}
                      disabled={atLimit || generating}
                    >
                      Re-upload
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Template picker */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-th-editor-muted">
          Choose a template
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {templates.map((t) => {
            const active = t.id === selected.id;
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-colors ${
                  active
                    ? "border-th-forest/50 bg-th-forest/5"
                    : "border-th-editor-border hover:border-th-editor-text/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-th-editor-text">
                    <input
                      type="radio"
                      name="template"
                      checked={active}
                      onChange={() => setSelected(t)}
                      className="accent-th-forest"
                    />
                    {t.label}
                  </span>
                  {/* Open the template in a NEW TAB. We deliberately do NOT use
                      the `download` attribute: iOS/iPadOS Safari ignores it for
                      PDFs and, when present, also suppresses target="_blank" — so
                      no tab opened. Opening in a new tab lets iPad users hand the
                      PDF straight to Goodnotes/Files via the share sheet. */}
                  <a
                    href={t.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded-lg border border-th-editor-border px-2.5 py-1 text-xs font-medium text-th-editor-text transition-colors hover:bg-th-surface-2"
                  >
                    ↗ Open template
                  </a>
                </div>
                <span className="mt-1.5 text-xs leading-relaxed text-th-editor-muted">
                  {t.description}
                </span>
              </label>
            );
          })}
        </div>
        {recommendation && (
          <p className="mt-3 rounded-lg bg-th-surface-2 px-3 py-2 text-xs leading-relaxed text-th-editor-muted">
            💡 {recommendation}
          </p>
        )}
        {tier === "free" && (
          <p className="mt-3 text-xs leading-relaxed text-th-editor-muted">
            On the free plan you can create one handwriting font from the
            standard template.{" "}
            <span className="font-medium text-th-editor-text">
              Note: this template has no numbers, so digits won&apos;t render in
              your own font (upgrade for the numbers &amp; symbols template).
            </span>
          </p>
        )}
      </div>

      {/* Upload */}
      <div className="mt-5 grid gap-3 sm:max-w-md">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Font name (optional)"
          disabled={generating || atLimit}
          className="h-10 rounded-xl border border-th-editor-border bg-th-surface-2 px-3.5 text-sm text-th-editor-text placeholder:text-th-editor-muted outline-none focus:border-th-forest disabled:opacity-50"
        />
        <label className="text-xs text-th-editor-muted">
          Upload your filled "{selected.label}" sheet(s):
        </label>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={generating || atLimit}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              submitFiles(Array.from(e.target.files));
            }
          }}
          className="block max-w-full text-sm text-th-editor-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-th-surface-2 file:px-4 file:py-2 file:text-sm file:font-medium file:text-th-editor-text hover:file:bg-th-surface disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {generating && (
        <p className="mt-3 flex items-center gap-2 text-sm text-amber-600">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600" />
          Generating your font… {jobStatus ? `(${jobStatus})` : ""} You can leave
          this page; it&apos;ll be ready in your list.
        </p>
      )}
      {atLimit && !generating && (
        <p className="mt-2 text-xs font-semibold text-red-500">
          You&apos;ve reached your plan&apos;s font limit. Remove a font to add
          another.
        </p>
      )}

      {/* Font list */}
      <ul className="mt-5 divide-y divide-th-editor-border">
        {fonts.length === 0 && openJobs.length === 0 && (
          <li className="py-4 text-sm text-th-editor-muted">
            No fonts yet — download a template, fill it in, and upload it to get
            started.
          </li>
        )}
        {fonts.map((font) => {
          const cov = describeCoverage(font.codepoints);
          const needsApproval = font.status === "ready" && !font.approved;
          return (
            <li key={font.id} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-th-editor-text">
                    {font.name}
                    {needsApproval && (
                      <span className="ml-2 rounded bg-th-amber/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-th-amber">
                        Needs approval
                      </span>
                    )}
                  </p>
                  <p className={`text-xs ${STATUS_TONE[font.status]}`}>
                    {STATUS_LABEL[font.status]}
                    {font.status === "ready" && font.glyph_count
                      ? ` · ${font.glyph_count} glyphs`
                      : ""}
                  </p>
                  {font.status === "ready" && (
                    <p className="mt-0.5 text-xs text-th-editor-muted">
                      Covers: {cov.groups.join(", ") || "—"}
                      {cov.missing.length > 0 && (
                        <>
                          {" · "}
                          <span className="text-th-amber">
                            no {cov.missing.join(" / ")}
                          </span>{" "}
                          (those characters won&apos;t render)
                        </>
                      )}
                    </p>
                  )}
                </div>
                <Button
                  variant="dark-ghost"
                  size="sm"
                  onClick={() => onDelete(font)}
                  disabled={deleting === font.id}
                  className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleting === font.id ? "Removing…" : "Remove"}
                </Button>
              </div>

              {/* Preview + approve step */}
              {needsApproval && (
                <div className="mt-2 rounded-xl border border-th-amber/30 bg-th-amber/8 p-3">
                  <p className="text-xs text-th-editor-muted">
                    Check the sample below, then approve it to start writing with
                    this font. Not right? Re-upload a cleaner copy.
                  </p>
                  {previewUrls[font.id] ? (
                    <FontPreview fontId={font.id} url={previewUrls[font.id]} />
                  ) : (
                    <p className="mt-2 text-xs text-th-editor-muted">Loading preview…</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <Button
                      size="sm"
                      variant="action"
                      onClick={() => onApprove(font)}
                      disabled={approving === font.id}
                    >
                      {approving === font.id ? "Approving…" : "Approve & use"}
                    </Button>
                    <Button
                      size="sm"
                      variant="dark-secondary"
                      onClick={() => onDelete(font)}
                      disabled={deleting === font.id}
                    >
                      Re-upload
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
