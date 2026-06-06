# TypedHand font-worker

Turns a **marked-up Calligraphr template PDF** into a **TrueType (.ttf)** handwriting
font for TypedHand's "generate my own font" (Pro) feature. One filled template = one
font variant; a user uploads several sheets to get several variants, which the editor's
per-character randomizer mixes for a natural hand-written look.

Status: **M1 (converter) + M2 (QR registry, potrace, FastAPI + Docker) + M3 (Supabase
job queue, "Generate my font" route, polling worker) done and validated.** Editor wiring
+ deploy (M4–M5) are next — see the roadmap below.

## Setup

Pure-Python, runs on Windows for dev. Native tooling (potrace/fontforge) is deferred to
the eventual Linux container.

```
pip install pymupdf opencv-python-headless numpy fonttools pytesseract pillow
```

Tesseract (only used by the OCR *fallback*) is at
`%LOCALAPPDATA%\Programs\Tesseract-OCR`; the high-accuracy model is in `./tessdata/`
(`eng.traineddata`, tessdata_best). `convert.py` finds both automatically; override the
binary with the `TESSERACT_CMD` env var.

## Usage

```
# Known template (reliable) — uses the stored layout:
python convert.py path/to/filled.pdf --name MyHand --layout standard_de

# Unknown template (best-effort) — OCRs the printed cell labels:
python convert.py path/to/filled.pdf --name MyHand

# --debug also writes _dbg_<name>_p<N>.png montages (detected cells + mapped chars).
```

Output: `<name>.ttf` next to the script (or `--out path.ttf`). Eyeball quality by
rendering a pangram with Pillow (see `debug/final_pangram.png` for the reference result).

## How it works (per page)

1. **Isolate ink.** Render the page twice — blank template (`annots=False`) and filled
   (`annots=True`). The user's ink is a Stamp annotation layer, so
   `ink = pixels that go solidly dark between the two renders`. This yields *pure*
   handwriting — no guide lines, reference glyphs, labels, QR, or drop-shadows. (Key trick.)
2. **Detect the grid.** Column dividers are faint grey (threshold `inv>25`); row borders
   are darker (`inv>70`). Detected separately via morphology → cell rectangles. All test
   samples gave an identical 8-column grid.
3. **Map cell → character.**
   - **Stored layout (preferred):** `LAYOUTS["standard_de"]` etc. Because TypedHand issues
     the template, the layout is known exactly. Identify a template by its page-1 QR id
     (`cv2.QRCodeDetector` on the blank render).
   - **OCR fallback:** `ocr_label()` (Tesseract psm10) reads the printed label. Only ~85%
     accurate on the tiny single-char labels, and misreads cause dedup-dropped glyphs — so
     it is **not** the source of truth.
4. **Baseline-align.** Per-row baseline = median of glyph bounding-box bottoms (descenders
   are the minority), so g/p/q/y sit below the baseline. One global px→em scale preserves
   each glyph's natural relative size (cap height ≈ 700 of UPM 1000).
5. **Vectorize.** **potrace** (smooth Béziers) when available — the pure-Python
   `potracer` package on dev, the native `potrace` binary in the container. potracer
   traces the 0-region, so the ink mask is inverted; cubic Béziers are converted to
   TrueType quadratics via `Cu2QuPen` (`reverse_direction=True` to get the outer-CW /
   holes-CCW winding). Falls back to `cv2.findContours` polygons if potrace is missing
   (force with `FONTWORKER_NO_POTRACE=1`).
6. **Assemble.** `fontTools.FontBuilder` → `.ttf`. `convert.convert()` returns a metadata
   dict (`glyphs`, `layout`, `qr_id`, `scale`, `method`).

## Service (M2)

`service.py` is a FastAPI wrapper:

- `GET /health` → `{ok, potrace, layouts, known_templates}`
- `POST /generate` (multipart: one or more `files` PDFs + optional `name`) → a single
  `.ttf` for one PDF, or a `.zip` of `.ttf`s + `manifest.json` for several. Each PDF = one
  variant. Carries no Supabase/state — M3's job worker calls it and stores the results.

Run locally: `uvicorn service:app --reload --port 8080`. Build the container with the
`Dockerfile` (installs `potrace`, `fontforge`, `tesseract-ocr` eng+deu, opencv libs).

## Job worker (M3)

`worker.py` is a long-lived polling worker (same image, different entrypoint:
`CMD ["python", "worker.py"]`). It:

1. Atomically claims one `queued` job via the `claim_font_job()` RPC
   (`FOR UPDATE SKIP LOCKED`, so replicas never collide).
2. Downloads each source PDF from `personal-fonts`, runs `convert.convert()`.
3. Uploads each TTF to `<user_id>/fonts/<font_id>.ttf` and inserts one
   `user_fonts` row (status `ready`, with `font_path` + glyph/layout metadata).
4. Marks the job `done` (or requeues / `failed` after `MAX_ATTEMPTS`).

Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required), `FONT_BUCKET`
(default `personal-fonts`), `POLL_INTERVAL` (default 5s), `MAX_ATTEMPTS` (3).

The enqueue side lives in the Next app: `POST /api/fonts/generate` (Pro-gated,
validates + uploads PDFs, inserts the `font_jobs` row) and `GET ?jobId=` for
status. Schema: `supabase/migrations/003_font_jobs.sql` (apply with your usual
Supabase flow — `font_jobs` table + RLS + `claim_font_job()`, and new
`user_fonts` columns).

## Known sample templates (QR id → layout)

The three dev samples are **different** Calligraphr templates (same grid geometry,
different labels), which is why we map by stored layout, not a single hardcoded table.

| Sample   | Pages | Page-1 QR id                     | Layout name    | Charset                          |
|----------|-------|----------------------------------|----------------|----------------------------------|
| 12.pdf   | 2     | `CICCA33B5A5A2A12B4A2ZA7ZA`      | `standard_de`  | punct + A–Z + a–z + umlauts (full reference) |
| 21.pdf   | 1     | `CICCA48J8P2F3A7ZA8242A`         | `digits_first` | 0–9, A–Z, a–z, € (omits caps Q/X/Y) |
| 7.pdf    | 2     | `CICCA33B3E2Q2A2Y3A7I`           | `punct_first`  | punct + 0–9 + letters (omits caps X/Y, lower q/y) |

All three are registered in `convert.py` (`LAYOUTS` + `QR_TO_LAYOUT`) and verified by
reading the blank-template label montages, glyph-count arithmetic, and rendered pangrams.
At convert time the page-1 QR id is decoded and mapped to its layout automatically; pass
`--layout NAME` to override, or omit a known id to fall back to OCR.

## Roadmap

- **M2** ✅ — QR-id → layout registry; 12/21/7 layouts registered + verified. FastAPI
  service (`service.py`) + `Dockerfile` (`potrace fontforge tesseract-ocr`); vectorization
  switched to potrace with a cv2 fallback.
- **M3** ✅ — `font_jobs` table + migration (`003_font_jobs.sql`), `POST /api/fonts/generate`
  (upload to `personal-fonts`, enqueue), polling `worker.py` (builds TTF(s), writes
  `user_fonts` rows, marks job done). Verified via tsc + a mock-Supabase run of `process_job`.
- **M4** (next) — Load a user's variants into `components/editor/handwriting-engine.ts`'s
  per-character randomizer; multi-sheet upload UI; gate behind Pro tier.
- **M5** — Deploy the worker container (Fly.io / Railway).

Constraints: clean high-quality PDFs only (users mark up + re-upload the provided PDF —
no photos); the pipeline runs automatically on "Generate my font", no manual step.
```
