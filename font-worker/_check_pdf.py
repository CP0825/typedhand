"""
Diagnose why a filled-template PDF failed with "couldn't read any handwriting".

The converter isolates ink by diffing the page rendered WITHOUT annotations
against the page rendered WITH annotations (convert.extract_glyphs). That only
works when the handwriting is stored as a PDF *annotation layer*. If a note app
flattened the ink into the page content (or it's a print-to-PDF / scan), the two
renders are identical, the diff is empty, and every cell looks blank.

This script reports, per page:
  - how many annotations the page has
  - the ink-pixel count from the annots-diff (what the converter actually sees)
  - whether the cell grid was detected

Run:
  python _check_pdf.py path/to/their_sheet.pdf [--layout template_3]

VERDICT guide:
  annots=0 and ink~0   -> FLATTENED PDF. Diff trick can't see the ink. This is
                          the usual cause of the error. Fix = diff against the
                          known blank template instead (see notes below), which
                          also covers print-to-PDF and the in-browser writer.
  annots>0 but ink~0   -> annotations exist but aren't darkening the page
                          (e.g. highlight/transparent ink, or wrong colour).
  ink high, grid fails -> not an ink problem; grid/threshold issue instead.
"""
from __future__ import annotations
import argparse
import fitz
import numpy as np

from convert import render, ink_mask, detect_grid, LAYOUTS


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--layout", default=None,
                    help="template_1..template_5 (optional; only affects nothing here, for reference)")
    args = ap.parse_args()

    doc = fitz.open(args.pdf)
    print(f"{args.pdf}: {doc.page_count} page(s)\n")

    total_ink = 0
    total_annots = 0
    for pno in range(doc.page_count):
        page = doc[pno]
        annots = list(page.annots() or [])
        annot_types = [a.type[1] for a in annots]  # human-readable subtype

        base = render(page, annots=False)
        full = render(page, annots=True)
        ink = ink_mask(base, full)
        ink_px = int((ink > 0).sum())

        # Did anything differ at all between the two renders?
        raw_diff = int((np.abs(base.astype(int) - full.astype(int)) > 10).sum())

        try:
            xs, ys = detect_grid(base)
            grid = f"{len(xs)-1} cols x {len(ys)-1} rows"
            grid_ok = len(xs) >= 2 and len(ys) >= 2
        except Exception as e:  # noqa: BLE001
            grid = f"FAILED ({e})"
            grid_ok = False

        total_ink += ink_px
        total_annots += len(annots)

        print(f"page {pno}:")
        print(f"  annotations : {len(annots)}  {annot_types if annot_types else ''}")
        print(f"  ink pixels  : {ink_px:>8}  (diff annots-off vs annots-on)")
        print(f"  raw px diff : {raw_diff:>8}  (any change between the two renders)")
        print(f"  grid        : {grid}  -> {'ok' if grid_ok else 'NO GRID'}")
        print()

    print("VERDICT:")
    if total_annots == 0 and total_ink < 100:
        print("  FLATTENED PDF — no annotation layer, so the converter sees no ink.")
        print("  This is the cause of 'couldn't read any handwriting'.")
        print("  The user's app exported the ink baked into the page content.")
        print("  Robust fix: diff the upload against the KNOWN blank template")
        print("  (public/templates/<id>.pdf) instead of annots-off of the upload.")
    elif total_ink < 100:
        print("  Annotations exist but don't darken the page enough for the diff")
        print("  (transparent/highlighter ink, or non-dark colour).")
    else:
        print(f"  Ink IS detected ({total_ink} px) — the failure is elsewhere")
        print("  (grid detection / layout mapping). Re-run convert.py --debug.")


if __name__ == "__main__":
    main()
