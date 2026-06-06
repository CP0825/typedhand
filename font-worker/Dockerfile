# TypedHand font-worker — converts filled Calligraphr PDFs into TTF fonts.
FROM python:3.12-slim

# Native tooling:
#  - potrace        : smooth Bézier glyph outlines (convert.py uses it directly;
#                     potracer is the pure-Python fallback already in pip)
#  - fontforge      : font post-processing / validation utility
#  - tesseract-ocr  : OCR fallback for unregistered templates (eng + deu)
#  - libgl/libglib  : runtime libs for opencv-python-headless
#  - qpdf/poppler   : robust PDF handling for PyMuPDF inputs
RUN apt-get update && apt-get install -y --no-install-recommends \
        potrace \
        fontforge \
        tesseract-ocr \
        tesseract-ocr-eng \
        tesseract-ocr-deu \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # tessdata_best (eng) ships in the repo; point pytesseract at it.
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY convert.py service.py worker.py ./
# Bundled high-accuracy model for the OCR fallback (optional; eng).
COPY tessdata ./tessdata

EXPOSE 8080
# Two roles share this image:
#   - FastAPI service (default): synchronous POST /generate.
#   - Polling job worker:  override CMD with ["python", "worker.py"].
# Single uvicorn worker; conversion is CPU-bound and short. Scale via replicas.
CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8080"]
