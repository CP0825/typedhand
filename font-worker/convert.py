"""
Calligraphr filled-template PDF  ->  TrueType font.

Pipeline (per page):
  1. Render the blank template (annots off) and the filled sheet (annots on).
  2. Ink = pixels that got solidly dark once the ink annotation is drawn.
     -> pure handwriting, no guide lines / reference glyphs / labels / QR.
  3. Detect the cell grid from the darker grey grid-border lines.
  4. Map each cell -> character via the known standard layout (QR cells skipped).
     (Pro/custom templates will swap this for OCR of the printed cell label.)
  5. Per cell: crop ink, find its bounding box.
  6. Per ROW baseline = median of glyph-bbox bottoms (descenders are the minority,
     so the median lands on the writing baseline). One global px->em scale keeps
     every glyph's natural relative size.
  7. Vectorize each glyph (cv2 contours, hole-aware) into em-square outlines.
  8. Assemble a .ttf with fontTools.FontBuilder.

Usage:
  python convert.py <filled.pdf> [--name FontName] [--out path.ttf] [--debug]
"""
from __future__ import annotations
import argparse, os, statistics, sys
import fitz
import cv2
import numpy as np
import pytesseract
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

# potrace gives smooth Bézier outlines; cv2 contours (polygonal) are the
# fallback when potrace isn't available. The pure-Python `potracer` package
# imports as `potrace` and works on Windows dev; the Linux container also has
# the native `potrace` binary (apt) for parity.
try:
    import potrace as _potrace
    _HAVE_POTRACE = True
except ImportError:
    _HAVE_POTRACE = False
# Allow forcing the cv2 path (e.g. for A/B comparison) via env var.
_FORCE_CV2 = os.environ.get("FONTWORKER_NO_POTRACE") == "1"

# Tesseract location: PATH in the Linux container, explicit on Windows dev.
_TCMD = os.environ.get("TESSERACT_CMD") or os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "Programs", "Tesseract-OCR", "tesseract.exe")
if os.path.exists(_TCMD):
    pytesseract.pytesseract.tesseract_cmd = _TCMD

# Prefer the high-accuracy tessdata_best model if present next to this file.
# pytesseract splits the config string on spaces, so the path must not be
# quoted (and must not contain spaces) — pass it bare via --tessdata-dir.
_TDATA = os.path.join(os.path.dirname(__file__), "tessdata")
_TDATA_ARG = f" --tessdata-dir {_TDATA}" if os.path.exists(
    os.path.join(_TDATA, "eng.traineddata")) else ""

# Characters the printed cell labels may contain (drives the OCR whitelist).
WHITELIST = ("ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789"
             "!\"'(),-./:;?@&%#+*=_")

DPI = 300
UPM = 1000           # units per em
TARGET_CAP = 700     # desired cap height in em units -> sets global scale
ASCENT = 800
DESCENT = -200

# Known template layouts, keyed by name. Because TypedHand issues the template
# to the user, the cell->character map is known exactly and need not be guessed.
# None = a non-writing cell (the QR block). OCR is the fallback for templates
# not in this registry.
LAYOUTS = {
    # Standard EN/DE template (punctuation, A-Z, a-z, then umlauts on page 2).
    # == sample 12.pdf, the full reference template. Verified cell-by-cell.
    "standard_de": [
        [  # page 0
            ["!", '"', "'", ",", ".", ":", None, None],
            [";", "?", "A", "B", "C", "D", None, None],
            ["E", "F", "G", "H", "I", "J", "K", "L"],
            ["M", "N", "O", "P", "Q", "R", "S", "T"],
            ["U", "V", "W", "X", "Y", "Z", "a", "b"],
            ["c", "d", "e", "f", "g", "h", "i", "j"],
            ["k", "l", "m", "n", "o", "p", "q", "r"],
            ["s", "t", "u", "v", "w", "x", "y", "z"],
        ],
        [  # page 1
            ["¨", "Ä", "Ö", "Ü", "ß", "ä", None, None],
            ["ö", "ü", None, None, None, None, None, None],
        ],
    ],
    # Digits-first single-page template (== sample 21.pdf). Verified by eye +
    # glyph count (60 glyphs + 4 QR cells). NB: this sample omits uppercase
    # Q, X, Y (present in lowercase) and ends with the euro sign.
    "digits_first": [
        [  # page 0 (only page)
            ["0", "1", "2", "3", "4", "5", None, None],
            ["6", "7", "8", "9", "A", "B", None, None],
            ["C", "D", "E", "F", "G", "H", "I", "J"],
            ["K", "L", "M", "N", "O", "P", "R", "S"],
            ["T", "U", "V", "W", "Z", "a", "b", "c"],
            ["d", "e", "f", "g", "h", "i", "j", "k"],
            ["l", "m", "n", "o", "p", "q", "r", "s"],
            ["t", "u", "v", "w", "x", "y", "z", "€"],
        ],
    ],
    # Punctuation-first two-page template (== sample 7.pdf). Verified by eye +
    # glyph count (75 total). NB: this sample omits uppercase X, Y and
    # lowercase q, y.
    "punct_first": [
        [  # page 0
            ["!", '"', "%", "&", "'", "(", None, None],
            [")", "+", ",", "-", ".", "/", None, None],
            ["0", "1", "2", "3", "4", "5", "6", "7"],
            ["8", "9", ":", ";", "=", "?", "@", "A"],
            ["B", "C", "D", "E", "F", "G", "H", "I"],
            ["J", "K", "L", "M", "N", "O", "P", "Q"],
            ["R", "S", "T", "U", "V", "W", "Z", "a"],
            ["b", "c", "d", "e", "f", "g", "h", "i"],
        ],
        [  # page 1
            ["j", "k", "l", "m", "n", "o", None, None],
            ["p", "r", "s", "t", "u", "v", None, None],
            ["w", "x", "z", None, None, None, None, None],
        ],
    ],

    # =======================================================================
    # TypedHand-issued templates (the only ones a user can pick — see
    # lib/templates.ts). These are 6-COLUMN Calligraphr sheets; the cell ->
    # character map is fixed and passed in explicitly via the job's `template`
    # field, so no QR decode or OCR is ever needed. None = QR block / empty cell.
    # The bare accent cells (`, ´, ¨, ˆ, ¸, «, »…) are spacing marks Calligraphr
    # prints so the user can draw the accent itself.
    # =======================================================================
    # Template 1 — "most important letters": lowercase a-z + German umlauts.
    "template_1": [
        [  # page 0 (only page)
            ["a", "b", "c", "d", None, None],
            ["e", "f", "g", "h", "i", "j"],
            ["k", "l", "m", "n", "o", "p"],
            ["q", "r", "s", "t", "u", "v"],
            ["w", "x", "y", "z", "ß", "ä"],
            ["ö", "ü", None, None, None, None],
        ],
    ],
    # Template 2 — Spanish: punctuation, A-Z, a-z, Spanish accents/letters.
    "template_2": [
        [  # page 0
            ["!", '"', "'", ";", None, None],
            ["?", "A", "B", "C", "D", "E"],
            ["F", "G", "H", "I", "J", "K"],
            ["L", "M", "N", "O", "P", "Q"],
            ["R", "S", "T", "U", "V", "W"],
            ["X", "Y", "Z", "a", "b", "c"],
        ],
        [  # page 1
            ["d", "e", "f", "g", None, None],
            ["h", "i", "j", "k", None, None],
            ["l", "m", "n", "o", "p", "q"],
            ["r", "s", "t", "u", "v", "w"],
            ["x", "y", "z", "¡", "¨", "´"],
            ["¿", "Á", "É", "Í", "Ñ", "Ó"],
        ],
        [  # page 2
            ["Ú", "á", "é", "í", None, None],
            ["ñ", "ó", "ú", "˜", None, None],
        ],
    ],
    # Template 3 — standard EN/DE template WITHOUT digits (the free-tier sheet).
    "template_3": [
        [  # page 0
            ["!", '"', "'", ",", None, None],
            [".", ":", ";", "?", "A", "B"],
            ["C", "D", "E", "F", "G", "H"],
            ["I", "J", "K", "L", "M", "N"],
            ["O", "P", "Q", "R", "S", "T"],
            ["U", "V", "W", "X", "Y", "Z"],
        ],
        [  # page 1
            ["a", "b", "c", "d", None, None],
            ["e", "f", "g", "h", "i", "j"],
            ["k", "l", "m", "n", "o", "p"],
            ["q", "r", "s", "t", "u", "v"],
            ["w", "x", "y", "z", "¨", "Ä"],
            ["Ö", "Ü", "ß", "ä", "ö", "ü"],
        ],
    ],
    # Template 4 — special characters + digits + lowercase a-z.
    "template_4": [
        [  # page 0
            ["!", '"', "%", "&", None, None],
            ["'", "(", ")", "+", ",", "-"],
            [".", "/", "0", "1", "2", "3"],
            ["4", "5", "6", "7", "8", "9"],
            [":", ";", "=", "?", "@", "a"],
            ["b", "c", "d", "e", "f", "g"],
        ],
        [  # page 1
            ["h", "i", "j", "k", None, None],
            ["l", "m", "n", "o", "p", "q"],
            ["r", "s", "t", "u", "v", "w"],
            ["x", "y", "z", None, None, None],
        ],
    ],
    # Template 5 — French: lowercase a-z, French accents + accented letters.
    "template_5": [
        [  # page 0
            ["`", "a", "b", "c", None, None],
            ["d", "e", "f", "g", "h", "i"],
            ["j", "k", "l", "m", "n", "o"],
            ["p", "q", "r", "s", "t", "u"],
            ["v", "w", "x", "y", "z", "¨"],
            ["«", "´", "¸", "»", "À", "Â"],
        ],
        [  # page 1
            ["Ç", "È", "É", "Ê", None, None],
            ["Ë", "Î", "Ò", "Ô", None, None],
            ["Ö", "Ù", "à", "â", "ç", "è"],
            ["é", "ê", "ë", "î", "ò", "ô"],
            ["ö", "ù", "ˆ", None, None, None],
        ],
    ],
}

# QR id (decoded from the page-1 QR block of the blank template) -> layout name.
# Because TypedHand issues the template, the QR id deterministically identifies
# the cell layout — no per-upload OCR needed. Unknown ids fall back to OCR.
QR_TO_LAYOUT = {
    "CICCA33B5A5A2A12B4A2ZA7ZA": "standard_de",  # 12.pdf
    "CICCA48J8P2F3A7ZA8242A": "digits_first",     # 21.pdf
    "CICCA33B3E2Q2A2Y3A7I": "punct_first",        # 7.pdf
    # The 5 issued TypedHand templates (page-0 QR id -> layout). This is the
    # ground-truth of which sheet was actually filled in, so it WINS over the
    # dropdown selection in convert() — a mismatched pick can't scramble glyphs.
    "CGCBA97ZA101A5A18A6A": "template_1",
    "CGCBA33B5A20A4A2ZA7C": "template_2",
    "CGCBA33B5A5A2A12B4A2ZA": "template_3",
    "CGCBA33B3E2Q2A2B33G": "template_4",
    "CGCBA96ZB46A3A9A4A3A5A2A": "template_5",
}

# Layout key -> blank template PDF filename. Because TypedHand issues these
# sheets, we hold the pristine blank original and can isolate the user's ink by
# diffing the filled upload against it (see _blank_template / extract_glyphs).
# This is what makes FLATTENED uploads work: many iPad apps (and our own
# in-browser writer) bake the handwriting into the page content rather than a
# PDF annotation layer, so the old annots-off-vs-annots-on diff saw nothing.
TEMPLATE_FILES = {
    "template_1": "template-1.pdf",
    "template_2": "template-2.pdf",
    "template_3": "template-3.pdf",
    "template_4": "template-4.pdf",
    "template_5": "template-5.pdf",
}

# Where the blank template PDFs live. In the container they are bundled next to
# this file (font-worker/templates/, see Dockerfile); on the dev box they also
# exist under the Next app's public/templates. An env var overrides both.
_HERE = os.path.dirname(os.path.abspath(__file__))
_TEMPLATE_DIRS = [
    os.environ.get("FONTWORKER_TEMPLATES_DIR"),
    os.path.join(_HERE, "templates"),
    os.path.join(_HERE, "..", "public", "templates"),
]


def _blank_template(layout):
    """Open the pristine blank template PDF for a layout, or None if we don't
    have one bundled (e.g. unknown layout / OCR path)."""
    fname = TEMPLATE_FILES.get(layout or "")
    if not fname:
        return None
    for d in _TEMPLATE_DIRS:
        if not d:
            continue
        path = os.path.join(d, fname)
        if os.path.exists(path):
            return fitz.open(path)
    return None


def detect_qr_id(page):
    """Decode the template-id QR on a blank page render. Returns the first
    decoded string, or None. Used to look up the stored layout."""
    base = render(page, annots=False)
    det = cv2.QRCodeDetector()
    try:
        ok, decoded, _, _ = det.detectAndDecodeMulti(base)
        if ok:
            for d in decoded:
                if d:
                    return d
    except cv2.error:
        pass
    d, _, _ = det.detectAndDecode(base)
    return d or None


def render(page, annots):
    pix = page.get_pixmap(dpi=DPI, annots=annots)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if pix.n >= 3 else img[:, :, 0]


def ink_mask(base, full):
    diff = cv2.subtract(base, full)
    ink = ((diff > 60) & (full < 130)).astype(np.uint8) * 255
    return cv2.medianBlur(ink, 3)


def _cluster(positions, gap):
    """Merge nearby line positions into single coordinates."""
    if not positions:
        return []
    positions = sorted(positions)
    groups, cur = [], [positions[0]]
    for p in positions[1:]:
        if p - cur[-1] <= gap:
            cur.append(p)
        else:
            groups.append(int(sum(cur) / len(cur)))
            cur = [p]
    groups.append(int(sum(cur) / len(cur)))
    return groups


def _drop_subdividers(coords):
    """Drop label-strip divider lines that sit just under a true cell border.

    The TypedHand (6-column Calligraphr) sheets print a thin label strip at the
    top of every cell; its underline is detected as an extra row line ~1/6 of a
    cell-height below the real border (gaps alternate small/large). A genuine row
    border is at least half a row apart from the previous one, so we keep a line
    only when its gap to the last kept line is >= 0.5 * the median gap. Uniform
    grids (e.g. the legacy 8-column sheet) have all gaps ~ the median and are
    left untouched.
    """
    if len(coords) < 4:
        return coords
    gaps = sorted(coords[i + 1] - coords[i] for i in range(len(coords) - 1))
    median = gaps[len(gaps) // 2]
    thr = median * 0.5
    kept = [coords[0]]
    for c in coords[1:]:
        if c - kept[-1] >= thr:
            kept.append(c)
    return kept


def detect_grid(base):
    """Return (xs, ys): clustered column and row border coordinates.

    Column dividers are faint grey (low threshold isolates them cleanly, with
    no interior vertical guides to confuse things). Row borders are darker than
    the faint interior horizontal guide lines, so a high threshold keeps only
    the true row borders. The per-cell label strip adds one extra horizontal
    line per row, which _drop_subdividers removes.
    """
    h, w = base.shape
    inv = 255 - base
    bw_lo = cv2.threshold(inv, 25, 255, cv2.THRESH_BINARY)[1]
    bw_hi = cv2.threshold(inv, 70, 255, cv2.THRESH_BINARY)[1]
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 12, 1))
    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 12))
    vert = cv2.morphologyEx(bw_lo, cv2.MORPH_OPEN, vk)
    horiz = cv2.morphologyEx(bw_hi, cv2.MORPH_OPEN, hk)

    hp = horiz.sum(axis=1)
    vp = vert.sum(axis=0)
    ys = _cluster([int(i) for i in np.where(hp > hp.max() * 0.5)[0]], gap=h // 60)
    xs = _cluster([int(i) for i in np.where(vp > vp.max() * 0.5)[0]], gap=w // 60)
    ys = _drop_subdividers(ys)  # remove per-cell label-strip underlines
    return xs, ys


def ocr_label(base, x0, y0, x1, y1):
    """Read the small printed character in a cell's top-left corner.

    Returns a single whitelisted char, or None for QR/empty cells. Templates
    differ between users, so the label is the ground-truth cell->codepoint
    mapping — never a hardcoded position.
    """
    cw = x1 - x0
    # The label sits at the cell's top-left and slightly straddles the top
    # border, so crop a tall band around it and strip the long border/guide
    # lines before OCR.
    crop = base[max(0, y0 - 22):y0 + 58, x0 + 6:x0 + int(cw * 0.45)]
    if crop.size == 0:
        return None
    bw = cv2.threshold(crop, 110, 255, cv2.THRESH_BINARY_INV)[1]  # text -> white
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(8, crop.shape[1] // 2), 1))
    bw = cv2.subtract(bw, cv2.morphologyEx(bw, cv2.MORPH_OPEN, hk))
    bw = cv2.medianBlur(bw, 3)
    dark = int((bw > 0).sum())
    if dark < 10 or dark > 0.45 * bw.size:  # empty cell or QR corner
        return None
    bw = cv2.copyMakeBorder(bw, 16, 16, 16, 16, cv2.BORDER_CONSTANT, value=0)
    bw = cv2.resize(bw, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    img = 255 - bw
    cfg = f"--oem 1 --psm 10{_TDATA_ARG} -c tessedit_char_whitelist={WHITELIST}"
    txt = pytesseract.image_to_string(img, config=cfg).strip().replace("\n", "").replace(" ", "")
    return txt[0] if txt else None


def extract_glyphs(page, pno, debug_name=None, page_layout=None, blank_page=None):
    # Ink isolation. Preferred path: diff the filled upload against the pristine
    # BLANK template page (blank_page) — this works no matter how the handwriting
    # is stored (PDF annotation layer, flattened page content, or our in-browser
    # writer), since the template printing is identical and cancels out. The
    # uploaded sheet keeps the same page geometry, so the renders are pixel
    # aligned at a fixed DPI. Fallback (no blank template available, e.g. the OCR
    # path): the legacy annots-off-vs-annots-on diff of the upload itself, which
    # only works when the ink is a real annotation layer.
    full = render(page, annots=True)
    if blank_page is not None:
        base = render(blank_page, annots=False)
        if base.shape != full.shape:
            # Defensive: re-encoded uploads could differ by a pixel; crop both to
            # the common region so the diff stays aligned.
            h = min(base.shape[0], full.shape[0])
            w = min(base.shape[1], full.shape[1])
            base, full = base[:h, :w], full[:h, :w]
    else:
        base = render(page, annots=False)
    ink = ink_mask(base, full)
    # Detect the grid from `base`: with a blank template this is the cleanest
    # possible source (no handwriting to confuse line detection).
    xs, ys = detect_grid(base)
    if len(xs) < 2 or len(ys) < 2:
        raise RuntimeError(f"grid detection failed: xs={len(xs)} ys={len(ys)}")

    glyphs = {}                       # char -> dict(mask, bbox, row)
    H, W = ink.shape
    dbg = cv2.cvtColor(ink, cv2.COLOR_GRAY2BGR) if debug_name else None
    for r in range(len(ys) - 1):
        for c in range(len(xs) - 1):
            x0, x1 = xs[c], xs[c + 1]
            y0, y1 = ys[r], ys[r + 1]
            cellw, cellh = x1 - x0, y1 - y0
            # Capture window. Pull the crop a little INSIDE the left/right borders
            # (so a border ghost can't leak in) but EXTEND it past the top and
            # bottom borders: people who write large push capitals/ascenders above
            # the printed box and descenders below it, and a crop fixed to the box
            # clips them. The connected-component containment below makes the wider
            # window safe — ink that really belongs to an adjacent row only dips a
            # little into this box, so its component is mostly outside the core
            # cell and is dropped.
            mx = int(cellw * 0.04)
            ext_top = int(cellh * 0.30)
            ext_bot = int(cellh * 0.12)
            wx0, wx1 = max(0, x0 + mx), min(W, x1 - mx)
            wy0, wy1 = max(0, y0 - ext_top), min(H, y1 + ext_bot)
            win = ink[wy0:wy1, wx0:wx1]
            if win.size == 0:
                continue
            # Core box (the printed cell) in window-local coords. A stroke belongs
            # to this cell when at least half its pixels fall inside the core; an
            # overflow stroke from a neighbour fails this and is skipped. `best`
            # salvages the dominant stroke if nothing clears the bar (glyph written
            # so large/high that most of it sits above the box) so we never drop a
            # letter that is plainly present.
            wh, ww = win.shape
            cx0, cx1 = max(0, x0 - wx0), min(ww, x1 - wx0)
            cy0, cy1 = max(0, y0 - wy0), min(wh, y1 - wy0)
            nlbl, lbl, st, _ = cv2.connectedComponentsWithStats(
                (win > 0).astype(np.uint8), 8)
            keep = np.zeros(win.shape, np.uint8)
            best = None                       # (core_px, component mask)
            for li in range(1, nlbl):
                if st[li, cv2.CC_STAT_AREA] < 8:
                    continue
                comp = lbl == li
                core_px = int(comp[cy0:cy1, cx0:cx1].sum())
                if core_px == 0:              # purely a neighbour's overflow
                    continue
                if core_px >= 0.5 * st[li, cv2.CC_STAT_AREA]:
                    keep[comp] = 255          # this cell owns the stroke
                elif best is None or core_px > best[0]:
                    best = (core_px, comp)
            if not keep.any() and best is not None:
                keep[best[1]] = 255           # salvage a very large/high glyph
            ys_i, xs_i = np.where(keep > 0)
            if len(xs_i) < 30:        # essentially empty cell -> skip
                continue
            # Known layout -> exact mapping; otherwise fall back to OCR.
            if page_layout is not None:
                ch = (page_layout[r][c] if r < len(page_layout)
                      and c < len(page_layout[r]) else None)
            else:
                ch = ocr_label(base, x0, y0, x1, y1)
            if not ch or ch in glyphs:
                continue
            gx0, gx1 = xs_i.min(), xs_i.max() + 1
            gy0, gy1 = ys_i.min(), ys_i.max() + 1
            glyph = keep[gy0:gy1, gx0:gx1]
            glyphs[ch] = {
                "mask": glyph,
                "abs_top": wy0 + gy0,
                "abs_bottom": wy0 + gy1,
                "abs_left": wx0 + gx0,
                "row": (pno, r),
                "w": gx1 - gx0,
                "h": gy1 - gy0,
            }
            if dbg is not None:
                cv2.rectangle(dbg, (wx0 + gx0, wy0 + gy0),
                              (wx0 + gx1, wy0 + gy1), (0, 0, 255), 2)
                cv2.putText(dbg, ch, (x0 + 8, y0 + 34),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 0, 0), 2)
    if dbg is not None:
        cv2.imwrite(debug_name, dbg)
    return glyphs


def row_baselines(glyphs):
    """Per-row baseline = median of glyph bottoms in that row."""
    by_row = {}
    for g in glyphs.values():
        by_row.setdefault(g["row"], []).append(g["abs_bottom"])
    return {r: statistics.median(v) for r, v in by_row.items()}


def vectorize(mask, scale, lsb, baseline_y, glyph_top_y):
    """Dispatch to potrace (smooth Béziers) when available, else cv2 polygons.

    Both produce a TTGlyphPen glyph in em units. Coordinate mapping is shared:
    Horizontal: glyph-relative, offset by the left side bearing `lsb` so the
    outline sits inside its advance box (origin at x=0).
    Vertical: image y grows downward, font y grows upward. baseline_y is the
    absolute image y of the writing baseline for this glyph's row, so a pixel
    at image row `py` maps to font y = (baseline_y - abs_y) * scale.
    """
    if _HAVE_POTRACE and not _FORCE_CV2:
        return vectorize_potrace(mask, scale, lsb, baseline_y, glyph_top_y)
    return vectorize_cv2(mask, scale, lsb, baseline_y, glyph_top_y)


def vectorize_potrace(mask, scale, lsb, baseline_y, glyph_top_y):
    """Trace the ink mask into smooth Bézier outlines with potrace.

    potrace emits cubic Béziers; TrueType needs quadratics, so we draw through
    a Cu2QuPen wrapping the TTGlyphPen. potracer traces the 0-valued region as
    foreground, so the ink mask is inverted before tracing. reverse_direction
    flips potrace's image-space winding (outer CW / holes CCW, y-down) to the
    TrueType convention (outer CW / holes CCW, y-up) after the y-flip.
    """
    pad = 6
    m = cv2.copyMakeBorder(mask, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    foreground = m > 0
    ttpen = TTGlyphPen(None)
    if not foreground.any():
        return ttpen.glyph(), 0
    path = _potrace.Bitmap(~foreground).trace(turdsize=2, alphamax=1.0,
                                              opttolerance=0.2)
    top_abs = glyph_top_y - pad

    def fpt(p):
        return (lsb + (p.x - pad) * scale,
                (baseline_y - (top_abs + p.y)) * scale)

    pen = Cu2QuPen(ttpen, max_err=2.0, reverse_direction=True)
    drew = False
    for curve in path:
        pen.moveTo(fpt(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                pen.lineTo(fpt(seg.c))
                pen.lineTo(fpt(seg.end_point))
            else:
                pen.curveTo(fpt(seg.c1), fpt(seg.c2), fpt(seg.end_point))
        pen.closePath()
        drew = True
    return (ttpen.glyph() if drew else TTGlyphPen(None).glyph()), 0


def vectorize_cv2(mask, scale, lsb, baseline_y, glyph_top_y):
    """Polygonal fallback tracer (cv2 contours + approxPolyDP)."""
    pad = 6
    m = cv2.copyMakeBorder(mask, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    contours, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    pen = TTGlyphPen(None)
    if not contours:
        return pen.glyph(), 0
    # glyph_top_y is the absolute image y of the glyph's top pixel; the padded
    # mask's row 0 corresponds to (glyph_top_y - pad).
    top_abs = glyph_top_y - pad
    for ci, cnt in enumerate(contours):
        if cv2.contourArea(cnt) < 8:
            continue
        eps = 1.2
        approx = cv2.approxPolyDP(cnt, eps, True).reshape(-1, 2)
        if len(approx) < 3:
            continue
        is_hole = hier[0][ci][3] != -1
        # Signed area in image space; flipping y inverts sign. Orient so the
        # outer contour is clockwise and holes counter-clockwise in font space.
        area = cv2.contourArea(cnt, oriented=True)
        pts = list(approx)
        # In image coords positive oriented area = CCW; after y-flip it becomes
        # CW. Make outer CW (area>0 in image) and holes opposite.
        want_reverse = (not is_hole and area < 0) or (is_hole and area > 0)
        if want_reverse:
            pts = pts[::-1]
        fpts = []
        for (px, py) in pts:
            abs_y = top_abs + py
            fx = lsb + (px - pad) * scale
            fy = (baseline_y - abs_y) * scale
            fpts.append((fx, fy))
        pen.moveTo(fpts[0])
        for p in fpts[1:]:
            pen.lineTo(p)
        pen.closePath()
    return pen.glyph(), 0


def build_font(glyphs, baselines, family, out_path):
    # Global scale from median cap height (uppercase letters present).
    caps = [g["h"] for ch, g in glyphs.items() if ch.isupper() and ch.isalpha()]
    ref = statistics.median(caps) if caps else statistics.median(
        [g["h"] for g in glyphs.values()])
    scale = TARGET_CAP / ref

    glyph_order = [".notdef"]
    cmap = {}
    ttglyphs = {}
    metrics = {}

    # .notdef: simple empty box.
    pen = TTGlyphPen(None)
    ttglyphs[".notdef"] = pen.glyph()
    metrics[".notdef"] = (int(0.5 * UPM), 0)

    # space (advance only).
    pen = TTGlyphPen(None)
    ttglyphs["space"] = pen.glyph()
    metrics["space"] = (int(0.30 * UPM), 0)
    glyph_order.append("space")
    cmap[0x20] = "space"

    for ch, g in glyphs.items():
        name = "uni%04X" % ord(ch)
        baseline_y = baselines[g["row"]]
        # advance width = ink width + side bearings (~12% each side).
        ink_w_units = g["w"] * scale
        side = 0.12 * ink_w_units + 20
        adv = int(ink_w_units + 2 * side)
        lsb = int(side)
        glyph, _ = vectorize(g["mask"], scale, lsb, baseline_y, g["abs_top"])
        ttglyphs[name] = glyph
        metrics[name] = (adv, lsb)
        cmap[ord(ch)] = name
        glyph_order.append(name)

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(ttglyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT)
    fb.setupNameTable({
        "familyName": family, "styleName": "Regular",
        "fullName": family, "psName": family.replace(" ", "") + "-Regular",
    })
    fb.setupOS2(sTypoAscender=ASCENT, sTypoDescender=DESCENT,
                usWinAscent=ASCENT, usWinDescent=-DESCENT)
    fb.setupPost()
    fb.save(out_path)
    return scale, len(glyphs)


def convert(pdf_path, family, out_path, debug=False, layout=None):
    """Build a TTF from a filled template PDF. Returns a metadata dict
    {family, out, glyphs, layout, qr_id, scale, method}."""
    # TODO(worker): add PNG support. iPad apps (Goodnotes/Notability/Files) can
    # export a high-res PNG as well as a PDF, but this only handles PDFs via
    # fitz.open(). To accept PNG: detect the input type and wrap a single-page
    # PNG into an in-memory PDF (e.g. fitz.open(stream=..., filetype="png") /
    # Pixmap) before the existing per-page extraction runs. The upload route in
    # app/api/fonts/generate/route.ts currently rejects PNG for this reason.
    doc = fitz.open(pdf_path)
    # Resolve the layout. The page-0 QR id is printed on the sheet itself, so it
    # is the ground truth of which template was actually filled in — it WINS over
    # the caller's `layout` hint (the dropdown selection), which may not match the
    # uploaded file. Fall back to the hint when the QR can't be decoded, then OCR.
    qid = detect_qr_id(doc[0]) if doc.page_count else None
    qr_layout = QR_TO_LAYOUT.get(qid)
    if qr_layout:
        if layout and layout != qr_layout:
            print(f"  QR id {qid!r} -> '{qr_layout}' (overrides requested '{layout}')")
        else:
            print(f"  QR id {qid!r} -> layout '{qr_layout}'")
        layout = qr_layout
    elif layout:
        print(f"  QR undecoded/unregistered ({qid!r}) -> using requested '{layout}'")
    elif qid:
        print(f"  QR id {qid!r} not registered -> OCR fallback")
    else:
        print("  no QR id decoded -> OCR fallback")
    lay = LAYOUTS.get(layout) if layout else None
    # Pristine blank template for ink isolation (None on the OCR/unknown path).
    blank = _blank_template(layout)
    if blank is not None:
        print(f"  ink isolation: diff vs blank template '{layout}'")
    else:
        print("  ink isolation: annotation diff (no blank template available)")
    all_glyphs = {}
    for pno in range(doc.page_count):
        dbg = (os.path.join(os.path.dirname(out_path),
               f"_dbg_{family}_p{pno}.png") if debug else None)
        page_layout = lay[pno] if lay and pno < len(lay) else None
        blank_page = (blank[pno] if blank is not None
                      and pno < blank.page_count else None)
        try:
            g = extract_glyphs(doc[pno], pno, debug_name=dbg,
                               page_layout=page_layout, blank_page=blank_page)
        except RuntimeError as e:
            print(f"  page {pno}: {e}")
            continue
        # Keep the first occurrence of each char across pages.
        for ch, gg in g.items():
            all_glyphs.setdefault(ch, gg)
        print(f"  page {pno}: {len(g)} glyphs")
    if not all_glyphs:
        # ValueError (not SystemExit): the worker catches Exception and fails the
        # job; SystemExit is a BaseException and would crash the worker process,
        # leaving the job stuck in 'processing' forever.
        raise ValueError("no glyphs extracted")
    baselines = row_baselines(all_glyphs)
    scale, n = build_font(all_glyphs, baselines, family, out_path)
    print(f"built {out_path}: {n} glyphs, scale={scale:.4f}")
    return {
        "family": family,
        "out": out_path,
        "glyphs": n,
        "layout": layout,
        "qr_id": qid,
        "scale": round(scale, 4),
        "method": "potrace" if (_HAVE_POTRACE and not _FORCE_CV2) else "cv2",
        # Code points this font actually covers (drives per-character variant
        # selection in the editor). Excludes space/.notdef.
        "codepoints": sorted(ord(ch) for ch in all_glyphs),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--name", default="MyHand")
    ap.add_argument("--out", default=None)
    ap.add_argument("--debug", action="store_true")
    ap.add_argument("--layout", default=None,
                    help="known template layout name (else OCR auto-detect)")
    a = ap.parse_args()
    out = a.out or os.path.join(os.path.dirname(__file__), a.name + ".ttf")
    try:
        convert(a.pdf, a.name, out, debug=a.debug, layout=a.layout)
    except ValueError as e:
        sys.exit(str(e))
