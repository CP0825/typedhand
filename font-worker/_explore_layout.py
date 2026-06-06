"""Dev-only: dump QR id + OCR'd cell-label grid for a template PDF.

Used to derive stored LAYOUTS for new templates. Not part of the service.
"""
import sys, os
import fitz, cv2, numpy as np
from convert import render, detect_grid, ocr_label

def qr_ids(page):
    base = render(page, annots=False)
    det = cv2.QRCodeDetector()
    # try multi first
    ok, decoded, pts, _ = det.detectAndDecodeMulti(base)
    ids = [d for d in decoded if d] if ok else []
    if not ids:
        d, _, _ = det.detectAndDecode(base)
        if d:
            ids = [d]
    return ids

def dump(pdf):
    doc = fitz.open(pdf)
    print(f"=== {pdf}  ({doc.page_count} pages) ===")
    for pno in range(doc.page_count):
        page = doc[pno]
        base = render(page, annots=False)
        if pno == 0:
            print("QR ids:", qr_ids(page))
        xs, ys = detect_grid(base)
        print(f"-- page {pno}: grid {len(xs)-1} cols x {len(ys)-1} rows --")
        grid = []
        for r in range(len(ys) - 1):
            row = []
            for c in range(len(xs) - 1):
                x0, x1 = xs[c], xs[c + 1]
                y0, y1 = ys[r], ys[r + 1]
                ch = ocr_label(base, x0, y0, x1, y1)
                row.append(ch if ch else ".")
            grid.append(row)
            print("  ", row)
        # also save a labeled montage of the blank template w/ grid + ocr
        dbg = cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)
        for x in xs: cv2.line(dbg, (x, 0), (x, base.shape[0]), (0,0,255), 1)
        for y in ys: cv2.line(dbg, (0, y), (base.shape[1], y), (0,255,0), 1)
        for r in range(len(ys) - 1):
            for c in range(len(xs) - 1):
                ch = grid[r][c]
                cv2.putText(dbg, ch, (xs[c]+xs[c+1]>>1, (ys[r]+ys[r+1])>>1),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255,0,0), 2)
        out = os.path.join("debug", f"_explore_{os.path.basename(pdf).split('.')[0]}_p{pno}.png")
        cv2.imwrite(out, dbg)
        print("   wrote", out)

if __name__ == "__main__":
    for p in sys.argv[1:]:
        dump(p)
