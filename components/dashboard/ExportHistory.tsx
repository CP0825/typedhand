import type { ExportFile } from "@/lib/exports";

function formatWhen(iso: string | null, name: string): string {
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
    <div className="mt-6 rounded-2xl border border-th-editor-border bg-th-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-th-editor-text">Your exports</h2>
          <p className="mt-1 max-w-xl text-sm text-th-editor-muted">
            Every PDF you export is saved here. You can re-open or download it any
            time — saved exports are read-only.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-th-surface-2 px-3 py-1 text-xs font-medium tabular-nums text-th-editor-muted">
          {exports.length}
        </span>
      </div>

      <ul className="mt-5 divide-y divide-th-editor-border">
        {exports.length === 0 && (
          <li className="py-4 text-sm text-th-editor-muted">
            No exports yet — create a PDF in the editor and it&apos;ll appear here.
          </li>
        )}
        {exports.map((f) => (
          <li
            key={f.path}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-th-editor-text">
                📄 {formatWhen(f.created_at, f.name)}
              </p>
              {f.size != null && (
                <p className="text-xs text-th-editor-muted">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-th-editor-border px-3 py-1.5 text-xs font-medium text-th-editor-text transition-colors hover:bg-th-surface-2"
              >
                Open
              </a>
              <a
                href={f.url}
                download
                className="rounded-lg border border-th-editor-border px-3 py-1.5 text-xs font-medium text-th-editor-text transition-colors hover:bg-th-surface-2"
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
