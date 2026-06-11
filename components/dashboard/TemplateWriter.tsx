"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/Button";
import type { FontTemplate } from "@/lib/templates";
import {
  strokesToPdf,
  type PageStrokes,
  type Stroke,
  type StrokePoint,
} from "@/lib/template-writer";

interface TemplateWriterProps {
  template: FontTemplate;
  /** Called with the merged PDF once the user finishes. */
  onComplete: (pdf: Blob) => void;
  onCancel: () => void;
}

type Tool = "pen" | "eraser";

// Base nib widths in PDF points.
const PEN_SIZES = { S: 1.2, M: 2.0, L: 3.0 } as const;
type PenKey = keyof typeof PEN_SIZES;

// Erase if a pointer comes within this many PDF points of any stroke point.
const ERASE_RADIUS = 8;

export function TemplateWriter({
  template,
  onComplete,
  onCancel,
}: TemplateWriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  // The original PDF bytes (kept for export) and the parsed pdf.js document.
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  // Strokes per page live in a ref (mutated during drawing for performance);
  // `version` bumps to trigger redraws/undo-button updates.
  const strokesRef = useRef<PageStrokes>([]);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // CSS px per scale-1 PDF point for the page currently on screen.
  const scaleRef = useRef(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [penKey, setPenKey] = useState<PenKey>("M");
  const [penOnly, setPenOnly] = useState(true);
  const [saving, setSaving] = useState(false);

  // -- Load the PDF once -----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(template.file);
        if (!res.ok) throw new Error("Could not load the template.");
        const buf = await res.arrayBuffer();
        bytesRef.current = buf;

        // pdf.js detaches the buffer it parses, so hand it a copy.
        const docData = buf.slice(0);
        const doc = await pdfjs.getDocument({ data: docData }).promise;
        if (cancelled) return;
        pdfRef.current = doc;
        strokesRef.current = Array.from({ length: doc.numPages }, () => []);
        setNumPages(doc.numPages);
        setPageIndex(0);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not open the template.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      pdfRef.current?.destroy().catch(() => {});
      pdfRef.current = null;
    };
  }, [template.file]);

  // -- Redraw the strokes layer for the current page -------------------------
  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const scale = scaleRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.strokeStyle = "#111";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const stroke of strokesRef.current[pageIndex] ?? []) {
      drawStrokePath(ctx, stroke, scale);
    }
  }, [pageIndex]);

  // -- Render a page (and its strokes) --------------------------------------
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const container = containerRef.current;
    const bg = bgCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!pdf || !container || !bg || !draw) return;

    const page = await pdf.getPage(pageIndex + 1);
    const unscaled = page.getViewport({ scale: 1 });

    // Fit the whole page inside the available area (leave a little padding).
    const maxW = container.clientWidth - 24;
    const maxH = container.clientHeight - 24;
    const scale = Math.max(
      0.1,
      Math.min(maxW / unscaled.width, maxH / unscaled.height),
    );
    scaleRef.current = scale;

    const dpr = window.devicePixelRatio || 1;
    const cssW = unscaled.width * scale;
    const cssH = unscaled.height * scale;
    const viewport = page.getViewport({ scale: scale * dpr });

    for (const c of [bg, draw]) {
      c.width = Math.round(viewport.width);
      c.height = Math.round(viewport.height);
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
    }

    const ctx = bg.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, bg.width, bg.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    redrawStrokes();
  }, [pageIndex, redrawStrokes]);

  // Re-render on page change, after load, and on resize.
  useEffect(() => {
    if (loading) return;
    renderPage();
    const onResize = () => renderPage();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [loading, renderPage]);

  // -- Pointer → strokes -----------------------------------------------------
  const drawingRef = useRef<Stroke | null>(null);

  const toPdfPoint = useCallback((e: React.PointerEvent): StrokePoint => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = scaleRef.current;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
      // Apple Pencil reports real pressure; mice/fingers report 0 → use 0.5.
      p: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  }, []);

  const ignorePointer = useCallback(
    (e: React.PointerEvent) =>
      // With "pencil only" on, finger/touch is reserved for scrolling & UI.
      penOnly && e.pointerType === "touch",
    [penOnly],
  );

  function eraseAt(pt: StrokePoint) {
    const list = strokesRef.current[pageIndex] ?? [];
    const kept = list.filter(
      (s) =>
        !s.points.some(
          (p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= ERASE_RADIUS,
        ),
    );
    if (kept.length !== list.length) {
      strokesRef.current[pageIndex] = kept;
      redrawStrokes();
      bump();
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (ignorePointer(e)) return;
    e.preventDefault();
    drawCanvasRef.current?.setPointerCapture(e.pointerId);
    const pt = toPdfPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
      return;
    }
    drawingRef.current = { points: [pt], size: PEN_SIZES[penKey] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (ignorePointer(e)) return;
    if (tool === "eraser") {
      if (e.buttons !== 0) eraseAt(toPdfPoint(e));
      return;
    }
    const stroke = drawingRef.current;
    if (!stroke) return;
    e.preventDefault();

    // Use coalesced events for smoother, denser Pencil strokes.
    const events =
      "getCoalescedEvents" in e.nativeEvent
        ? (e.nativeEvent as PointerEvent).getCoalescedEvents()
        : [e.nativeEvent as PointerEvent];
    const ctx = drawCanvasRef.current?.getContext("2d");
    const scale = scaleRef.current;
    for (const ev of events.length ? events : [e.nativeEvent as PointerEvent]) {
      const rect = drawCanvasRef.current!.getBoundingClientRect();
      const pt: StrokePoint = {
        x: (ev.clientX - rect.left) / scale,
        y: (ev.clientY - rect.top) / scale,
        p: ev.pressure && ev.pressure > 0 ? ev.pressure : 0.5,
      };
      const prev = stroke.points[stroke.points.length - 1];
      stroke.points.push(pt);
      // Incremental draw for responsiveness.
      if (ctx && prev) {
        ctx.strokeStyle = "#111";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = stroke.size * (0.55 + 0.8 * pt.p) * scale;
        ctx.beginPath();
        ctx.moveTo(prev.x * scale, prev.y * scale);
        ctx.lineTo(pt.x * scale, pt.y * scale);
        ctx.stroke();
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (ignorePointer(e)) return;
    const stroke = drawingRef.current;
    drawingRef.current = null;
    if (!stroke) return;
    (strokesRef.current[pageIndex] ??= []).push(stroke);
    redrawStrokes();
    bump();
  };

  // -- Toolbar actions -------------------------------------------------------
  function undo() {
    const list = strokesRef.current[pageIndex];
    if (list && list.length) {
      list.pop();
      redrawStrokes();
      bump();
    }
  }
  function clearPage() {
    strokesRef.current[pageIndex] = [];
    redrawStrokes();
    bump();
  }

  const strokeCount = strokesRef.current.reduce(
    (n, p) => n + (p?.length ?? 0),
    0,
  );
  const pageHasInk = (strokesRef.current[pageIndex]?.length ?? 0) > 0;

  async function finish() {
    if (!bytesRef.current || strokeCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      const pdf = await strokesToPdf(bytesRef.current.slice(0), strokesRef.current);
      onComplete(pdf);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the PDF.");
      setSaving(false);
    }
  }

  // -- Render ----------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-th-void/95 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-th-editor-border bg-th-surface px-4 py-3">
        <div className="mr-auto min-w-0">
          <p className="truncate text-sm font-semibold text-th-editor-text">
            ✍️ {template.label}
          </p>
          <p className="truncate text-xs text-th-editor-muted">
            Trace the light-grey letters with your Apple Pencil.
          </p>
        </div>

        {/* Pen / sizes / eraser */}
        <div className="flex items-center gap-1 rounded-xl border border-th-editor-border bg-th-surface-2 p-1">
          {(Object.keys(PEN_SIZES) as PenKey[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setTool("pen");
                setPenKey(k);
              }}
              className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                tool === "pen" && penKey === k
                  ? "bg-th-amber text-th-void"
                  : "text-th-editor-muted hover:bg-th-surface"
              }`}
              title={`Pen ${k}`}
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => setTool("eraser")}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
              tool === "eraser"
                ? "bg-th-amber text-th-void"
                : "text-th-editor-muted hover:bg-th-surface"
            }`}
            title="Eraser"
          >
            Erase
          </button>
        </div>

        <Button
          variant="dark-secondary"
          size="sm"
          onClick={undo}
          disabled={!pageHasInk}
        >
          Undo
        </Button>
        <Button
          variant="dark-ghost"
          size="sm"
          onClick={clearPage}
          disabled={!pageHasInk}
        >
          Clear
        </Button>

        <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-th-editor-muted">
          <input
            type="checkbox"
            checked={penOnly}
            onChange={(e) => setPenOnly(e.target.checked)}
            className="accent-th-amber"
          />
          Pencil only
        </label>

        <span className="mx-1 h-6 w-px bg-th-editor-border" />

        <Button variant="dark-ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="action"
          size="sm"
          onClick={finish}
          disabled={saving || strokeCount === 0}
        >
          {saving ? "Building…" : "Done — make my font"}
        </Button>
      </div>

      {/* Canvas stage */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden p-3"
      >
        {loading && (
          <p className="text-sm text-th-editor-muted">Loading template…</p>
        )}
        {error && (
          <p className="max-w-sm rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}
        <div className={loading || error ? "hidden" : "relative shadow-2xl"}>
          <canvas ref={bgCanvasRef} className="block rounded-sm bg-white" />
          <canvas
            ref={drawCanvasRef}
            className="absolute left-0 top-0 touch-none"
            style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
      </div>

      {/* Page pager */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-th-editor-border bg-th-surface px-4 py-2.5">
          <Button
            variant="dark-secondary"
            size="sm"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
          >
            ← Prev
          </Button>
          <span className="text-xs tabular-nums text-th-editor-muted">
            Page {pageIndex + 1} / {numPages}
          </span>
          <Button
            variant="dark-secondary"
            size="sm"
            onClick={() => setPageIndex((i) => Math.min(numPages - 1, i + 1))}
            disabled={pageIndex === numPages - 1}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

// Draw a full stroke onto a 2D context, in CSS px (the caller has reset the
// transform to device-pixel scale already). Pressure modulates each segment, so
// we stroke segment-by-segment rather than as one path.
function drawStrokePath(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number,
) {
  const pts = stroke.points;
  if (pts.length === 0) return;
  if (pts.length === 1) {
    const a = pts[0];
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(
      a.x * scale,
      a.y * scale,
      (stroke.size * (0.55 + 0.8 * a.p) * scale) / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1];
    const b = pts[k];
    ctx.lineWidth = stroke.size * (0.55 + 0.8 * ((a.p + b.p) / 2)) * scale;
    ctx.beginPath();
    ctx.moveTo(a.x * scale, a.y * scale);
    ctx.lineTo(b.x * scale, b.y * scale);
    ctx.stroke();
  }
}
