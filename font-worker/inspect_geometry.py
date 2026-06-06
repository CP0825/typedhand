"""
Stage-1 diagnostic: render a filled Calligraphr template, isolate the user's
ink by diffing the full render against the blank-template render, detect the
cell grid from the grey guide lines, and dump debug images so we can verify
geometry + ink extraction before building the font.

Run: python inspect_geometry.py <pdf> [page]
"""
import sys, os
import fitz
import cv2
import numpy as np

DPI = 300
DEBUG = os.path.join(os.path.dirname(__file__), "debug")


def render(page, annots):
    pix = page.get_pixmap(dpi=DPI, annots=annots)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    if pix.n >= 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    else:
        img = img[:, :, 0]
    return img


def detect_grid(base_gray):
    """Find the cell rectangles from the template's grey grid lines."""
    # Grid lines are light grey; everything we care about is non-white.
    inv = 255 - base_gray
    bw = cv2.threshold(inv, 25, 255, cv2.THRESH_BINARY)[1]
    h, w = bw.shape

    # Extract long horizontal and vertical lines via morphology.
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(20, w // 25), 1))
    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(20, h // 25)))
    horiz = cv2.morphologyEx(bw, cv2.MORPH_OPEN, hk)
    vert = cv2.morphologyEx(bw, cv2.MORPH_OPEN, vk)

    # Collapse to 1-D profiles -> line positions.
    def peaks(profile, min_frac):
        thr = profile.max() * min_frac
        on = profile > thr
        pos = []
        i = 0
        while i < len(on):
            if on[i]:
                j = i
                while j < len(on) and on[j]:
                    j += 1
                pos.append((i + j - 1) // 2)
                i = j
            else:
                i += 1
        return pos

    ys = peaks(horiz.sum(axis=1), 0.4)
    xs = peaks(vert.sum(axis=0), 0.4)
    return xs, ys, horiz, vert


def main():
    pdf = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\const\Downloads\12.pdf"
    pageno = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    name = os.path.splitext(os.path.basename(pdf))[0]

    doc = fitz.open(pdf)
    page = doc[pageno]
    base = render(page, annots=False)   # blank template
    full = render(page, annots=True)    # template + ink

    # Ink = pixels that became significantly darker once annotations are drawn,
    # and are solidly dark (rejects grey guide lines and soft drop-shadows).
    diff = cv2.subtract(base, full)                       # positive where darker
    ink = ((diff > 60) & (full < 130)).astype(np.uint8) * 255
    ink = cv2.medianBlur(ink, 3)                          # despeckle

    xs, ys, horiz, vert = detect_grid(base)
    print(f"{name} p{pageno}: image {base.shape[1]}x{base.shape[0]}")
    print(f"  vertical lines (x): {xs}")
    print(f"  horizontal lines (y): {ys}")
    print(f"  ink pixels: {int((ink>0).sum())}")

    # Debug overlay: draw detected grid on the full render.
    over = cv2.cvtColor(full, cv2.COLOR_GRAY2BGR)
    for x in xs:
        cv2.line(over, (x, 0), (x, over.shape[0]), (0, 0, 255), 1)
    for y in ys:
        cv2.line(over, (0, y), (over.shape[1], y), (255, 0, 0), 1)
    cv2.imwrite(os.path.join(DEBUG, f"{name}_p{pageno}_grid.png"), over)
    cv2.imwrite(os.path.join(DEBUG, f"{name}_p{pageno}_ink.png"), ink)
    # Inverted ink for easy viewing (black ink on white).
    cv2.imwrite(os.path.join(DEBUG, f"{name}_p{pageno}_ink_view.png"), 255 - ink)
    print("  wrote debug images to", DEBUG)


if __name__ == "__main__":
    main()
