"""FastAPI wrapper around convert.py.

POST /generate  (multipart, one or more `files` PDFs + optional `name`)
  -> a single .ttf when one PDF is sent, or a .zip of .ttf files when several.
     Each PDF = one font variant (the editor's per-character randomiser mixes
     several variants for a natural hand-written look).

GET  /health  -> {"ok": true, "potrace": bool, ...} for container probes.

This is the CPU-heavy step; it carries no Supabase/state knowledge. M3's job
worker downloads the user's PDFs, calls this, and stores the results.
"""
from __future__ import annotations
import io, os, tempfile, zipfile, re, shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, JSONResponse

import convert

app = FastAPI(title="TypedHand font-worker", version="1.0")

_SAFE = re.compile(r"[^A-Za-z0-9]+")


def _safe_name(name: str) -> str:
    cleaned = _SAFE.sub("", name or "")
    return cleaned or "MyHand"


def _build_one(pdf_bytes: bytes, family: str) -> tuple[bytes, dict]:
    """Run the converter on one PDF, returning (ttf_bytes, metadata)."""
    tmp = tempfile.mkdtemp(prefix="fw_")
    try:
        pdf_path = os.path.join(tmp, "in.pdf")
        out_path = os.path.join(tmp, family + ".ttf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        meta = convert.convert(pdf_path, family, out_path)
        with open(out_path, "rb") as f:
            return f.read(), meta
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


@app.get("/health")
def health():
    return {
        "ok": True,
        "potrace": convert._HAVE_POTRACE and not convert._FORCE_CV2,
        "layouts": sorted(convert.LAYOUTS),
        "known_templates": len(convert.QR_TO_LAYOUT),
    }


@app.post("/generate")
async def generate(files: list[UploadFile] = File(...),
                   name: str = Form("MyHand")):
    if not files:
        raise HTTPException(400, "no files uploaded")
    base = _safe_name(name)
    results = []  # (filename, ttf_bytes, meta)
    for i, up in enumerate(files):
        data = await up.read()
        if not data:
            raise HTTPException(400, f"empty file: {up.filename}")
        family = base if len(files) == 1 else f"{base}{i + 1}"
        try:
            ttf, meta = _build_one(data, family)
        except SystemExit as e:           # convert raises SystemExit on no glyphs
            raise HTTPException(422, f"{up.filename}: {e}")
        except Exception as e:
            raise HTTPException(500, f"{up.filename}: {e}")
        results.append((family + ".ttf", ttf, meta))

    if len(results) == 1:
        fname, ttf, meta = results[0]
        return Response(
            content=ttf, media_type="font/ttf",
            headers={
                "Content-Disposition": f'attachment; filename="{fname}"',
                "X-Font-Glyphs": str(meta.get("glyphs", "")),
                "X-Font-Layout": str(meta.get("layout", "")),
            },
        )

    buf = io.BytesIO()
    manifest = []
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for fname, ttf, meta in results:
            z.writestr(fname, ttf)
            meta = {k: v for k, v in meta.items() if k != "out"}
            manifest.append({"file": fname, **meta})
        import json
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
    buf.seek(0)
    return Response(
        content=buf.read(), media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{base}.zip"'},
    )


@app.get("/")
def root():
    return JSONResponse({"service": "typedhand font-worker",
                         "endpoints": ["/health", "POST /generate"]})
