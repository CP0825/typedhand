// ---------------------------------------------------------------------------
// In-browser template writer — shared types + PDF export
// ---------------------------------------------------------------------------
// The dashboard lets users fill an issued Calligraphr template directly in the
// browser with an Apple Pencil (or mouse), instead of round-tripping through a
// note-taking app. The strokes are captured in *PDF user-space points with a
// top-left origin* (i.e. pdf.js scale-1 viewport coordinates), which makes both
// on-screen drawing and this export resolution-independent.
//
// `strokesToPdf` loads the ORIGINAL template bytes and stamps the strokes onto
// the matching pages as real vector lines. The result is a PDF that looks just
// like a printed-then-scanned sheet, so font-worker/convert.py needs no changes
// — it flows through the exact same /api/fonts/generate upload path.
// ---------------------------------------------------------------------------

import { PDFDocument, rgb, LineCapStyle } from "pdf-lib";

/** A single sampled point, in scale-1 PDF points with a TOP-LEFT origin. */
export interface StrokePoint {
  x: number;
  y: number;
  /** Pointer pressure 0..1 (Apple Pencil); 0.5 for devices without pressure. */
  p: number;
}

export interface Stroke {
  points: StrokePoint[];
  /** Base nib width in PDF points, before pressure modulation. */
  size: number;
}

/** Strokes indexed by page (page 0 = first PDF page). */
export type PageStrokes = Stroke[][];

// Near-black ink. Pure black keeps the handwriting clearly separable from the
// light-grey guide glyphs when the worker thresholds the sheet.
const INK = rgb(0, 0, 0);

/** Thickness for a segment given the base nib size and average pressure. */
function thicknessFor(size: number, pressure: number): number {
  // Map pressure 0..1 onto ~0.55x..1.35x of the base width for a natural taper.
  return size * (0.55 + 0.8 * Math.max(0, Math.min(1, pressure)));
}

/**
 * Stamp captured strokes onto the original template PDF and return the merged
 * PDF as a Blob (ready to upload via /api/fonts/generate).
 *
 * @param originalBytes the untouched template PDF bytes
 * @param pageStrokes   strokes per page, in scale-1 top-left PDF points
 */
export async function strokesToPdf(
  originalBytes: ArrayBuffer,
  pageStrokes: PageStrokes,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const strokes = pageStrokes[i];
    if (!strokes || strokes.length === 0) continue;

    const page = pages[i];
    const { height } = page.getSize();

    for (const stroke of strokes) {
      const pts = stroke.points;
      if (pts.length === 0) continue;

      // A lone tap (dot): draw a tiny segment so it still renders as ink.
      if (pts.length === 1) {
        const a = pts[0];
        page.drawLine({
          start: { x: a.x, y: height - a.y },
          end: { x: a.x + 0.4, y: height - a.y },
          thickness: thicknessFor(stroke.size, a.p),
          color: INK,
          lineCap: LineCapStyle.Round,
        });
        continue;
      }

      // Convert the top-left captured points to pdf-lib's bottom-left origin and
      // draw each segment individually so pressure can modulate thickness.
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        page.drawLine({
          start: { x: a.x, y: height - a.y },
          end: { x: b.x, y: height - b.y },
          thickness: thicknessFor(stroke.size, (a.p + b.p) / 2),
          color: INK,
          lineCap: LineCapStyle.Round,
        });
      }
    }
  }

  const bytes = await pdfDoc.save();
  // Copy into a fresh, exactly-sized ArrayBuffer for the Blob.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: "application/pdf" });
}
