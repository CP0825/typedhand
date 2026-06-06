import type { ExportFile } from "@/lib/exports";

function formatWhen(iso: string | null, name: string): string {
  // Prefer storage created_at; fall back to the timestamp prefix in the name
  // (`2026-06-05T17-32-49-000Z__ab12cd.pdf`).
  let d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) {
    const m = name.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/);
    if (m) d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`);
  }
  if (!d || isNaN(d.getTime())) return "Saved export";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExportHistory({ exports }: { exports: ExportFile[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Your exports</h2>
          <p className="mt-1 max-w-xl text-sm text-ink/55">
            Every PDF you export is saved here. You can re-open or download it any
            time — saved exports are read-only.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-ink/5 px-3 py-1 text-xs font-medium tabular-nums text-ink/60">
          {exports.length}
        </span>
      </div>

      <ul className="mt-5 divide-y divide-ink/8">
        {exports.length === 0 && (
          <li className="py-4 text-sm text-ink/45">
            No exports yet — create a PDF in the editor and it&apos;ll appear here.
          </li>
        )}
        {exports.map((f) => (
          <li
            key={f.path}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                📄 {formatWhen(f.created_at, f.name)}
              </p>
              {f.size != null && (
                <p className="text-xs text-ink/45">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
              >
                Open
              </a>
              <a
                href={f.url}
                download
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
              >
                Download
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
