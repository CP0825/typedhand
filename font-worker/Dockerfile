# TypedHand font-worker — converts filled Calligraphr PDFs into TTF fonts.
# Deployed on Railway as a long-lived polling worker (worker.py).
FROM python:3.11-slim

# Native tooling required by the Python deps:
#  - libgl1 / libglib2.0-0 : runtime shared libs for opencv-python-headless (cv2)
#  - potrace               : native tracer kept for parity (convert.py prefers the
#                            pure-Python `potracer` from pip; this is the fallback)
#  - tesseract-ocr (+eng/deu): OCR fallback for unregistered / legacy templates
# PyMuPDF (fitz), fonttools and pillow ship self-contained wheels — no apt deps.
RUN apt-get update && apt-get install -y --no-install-recommends \
        potrace \
        tesseract-ocr \
        tesseract-ocr-eng \
        tesseract-ocr-deu \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # tessdata_best (eng) is bundled in the repo; point pytesseract at the system dir.
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Worker + shared converter. service.py is kept so the same image can also be run
# as the FastAPI endpoint if ever needed:
#   uvicorn service:app --host 0.0.0.0 --port 8080
COPY convert.py worker.py service.py ./
# Bundled high-accuracy OCR model (eng) for the fallback path.
COPY tessdata ./tessdata

# Railway worker: poll Supabase for queued font jobs and convert them.
# Long-lived loop, no HTTP port required.
CMD ["python", "worker.py"]
