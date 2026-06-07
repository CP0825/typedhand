"""TypedHand font-generation worker.

Polls the Supabase `font_jobs` table for queued jobs, converts each uploaded
Calligraphr PDF into a TTF (convert.py), stores the TTFs in the personal-fonts
bucket, writes one user_fonts row per variant, and marks the job done/failed.

Runs as its own long-lived process/container (separate from the FastAPI
service, though it shares the same image and convert.py). Deployed on Railway
(auto-deploy from GitHub `main`). Ink isolation lives in convert.py, which
diffs each upload against the bundled blank template (handles flattened PDFs).

Env:
  SUPABASE_URL                 (or NEXT_PUBLIC_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY    service-role key (bypasses RLS; keep secret)
  FONT_BUCKET                  default "personal-fonts"
  POLL_INTERVAL                seconds between polls when idle (default 5)
  MAX_ATTEMPTS                 give up + mark failed after N tries (default 3)
"""
from __future__ import annotations
import os, sys, time, uuid, tempfile, traceback
from datetime import datetime, timezone, timedelta

from supabase import create_client, Client

import convert


def _now() -> str:
    """ISO-8601 UTC timestamp for timestamptz columns (PostgREST stores the
    string verbatim, so a SQL now() literal would not be evaluated)."""
    return datetime.now(timezone.utc).isoformat()

BUCKET = os.environ.get("FONT_BUCKET", "personal-fonts")
POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL", "5"))
MAX_ATTEMPTS = int(os.environ.get("MAX_ATTEMPTS", "3"))
# Retry backoff for transient failures: delay = min(MAX, BASE * 2^(attempts-1)).
BACKOFF_BASE = float(os.environ.get("BACKOFF_BASE", "30"))
BACKOFF_MAX = float(os.environ.get("BACKOFF_MAX", "600"))
# A 'processing' job untouched for this long is assumed to belong to a worker
# that died mid-job; the reaper requeues it (or fails it once attempts run out).
STALE_TIMEOUT = os.environ.get("STALE_TIMEOUT", "10 minutes")


def _client() -> Client:
    url = os.environ.get("SUPABASE_URL") or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    return create_client(url, key)


def _safe_family(name: str, idx: int, multi: bool) -> str:
    # Internal TTF family name (psName etc.) — must be alphanumeric. Not shown to
    # the user; the app renders via a font_id-derived @font-face family.
    cleaned = "".join(ch for ch in (name or "") if ch.isalnum()) or "MyHand"
    return f"{cleaned}{idx}" if multi else cleaned


def _display_name(name: str, idx: int, multi: bool) -> str:
    # Human-readable label shown in the dashboard font list (e.g.
    # "Upload June 7, 2026"). Multi-sheet uploads get a " (n)" suffix.
    base = (name or "").strip() or "My handwriting"
    return f"{base} ({idx})" if multi else base


def process_job(sb: Client, job: dict) -> None:
    """Convert every source PDF in a job into a stored TTF + user_fonts row."""
    job_id = job["id"]
    user_id = job["user_id"]
    sources = job.get("source_paths") or []
    multi = len(sources) > 1
    # The user picks one of the fixed TypedHand templates per upload, so the
    # cell->character layout is known exactly (no QR/OCR). job["template"] holds
    # the convert.py layout key ("template_1".."template_5"); None falls back to
    # QR-id lookup / OCR for legacy jobs.
    template = job.get("template")
    font_ids: list[str] = []

    tmp = tempfile.mkdtemp(prefix="fwjob_")
    try:
        for i, src in enumerate(sources, start=1):
            # Download the uploaded PDF.
            pdf_bytes = sb.storage.from_(BUCKET).download(src)
            pdf_path = os.path.join(tmp, f"in{i}.pdf")
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)

            family = _safe_family(job.get("name", "MyHand"), i, multi)
            font_id = str(uuid.uuid4())
            out_path = os.path.join(tmp, f"{font_id}.ttf")
            meta = convert.convert(pdf_path, family, out_path, layout=template)

            # Store the TTF alongside the source, under the user's folder.
            font_path = f"{user_id}/fonts/{font_id}.ttf"
            with open(out_path, "rb") as f:
                sb.storage.from_(BUCKET).upload(
                    font_path, f.read(),
                    {"content-type": "font/ttf", "upsert": "false"})

            # One user_fonts row per variant (status 'ready').
            sb.table("user_fonts").insert({
                "id": font_id,
                "user_id": user_id,
                "name": _display_name(job.get("name", "MyHand"), i, multi),
                "source_path": src,
                "source_type": "application/pdf",
                "status": "ready",
                "font_path": font_path,
                "glyph_count": meta.get("glyphs"),
                "layout": meta.get("layout"),
                "variant_index": i,
                "job_id": job_id,
                "codepoints": meta.get("codepoints"),
            }).execute()
            font_ids.append(font_id)
            print(f"[job {job_id}] variant {i}/{len(sources)}: "
                  f"{meta.get('glyphs')} glyphs ({meta.get('layout')})")

        sb.table("font_jobs").update({
            "status": "done",
            "font_ids": font_ids,
            "finished_at": _now(),
            "updated_at": _now(),
            "error": None,
        }).eq("id", job_id).execute()
        print(f"[job {job_id}] done: {len(font_ids)} variant(s)")
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


def _backoff_seconds(attempts: int) -> float:
    """Exponential backoff, capped. attempts is 1-based (already incremented)."""
    return min(BACKOFF_MAX, BACKOFF_BASE * (2 ** max(0, attempts - 1)))


def _friendly_error(raw: str) -> str:
    """A short, user-facing reason shown on the dashboard (the raw traceback
    stays out of the UI)."""
    low = raw.lower()
    if "no glyphs" in low or "grid detection failed" in low:
        return ("We couldn't read any handwriting from that sheet. Please make "
                "sure every box is filled in clearly, then re-upload.")
    return ("We couldn't process that file. Please re-upload a clean, fully "
            "filled-in template PDF.")


def fail_job(sb: Client, job: dict, err: str, *, permanent: bool = False,
             friendly: str | None = None) -> None:
    """Mark failed (permanently, or once attempts run out), else requeue with an
    exponential backoff so transient problems get another try later."""
    job_id = job["id"]
    attempts = job.get("attempts", 0)  # already incremented by claim_font_job
    user_msg = (friendly or _friendly_error(err))[:2000]
    if permanent or attempts >= MAX_ATTEMPTS:
        sb.table("font_jobs").update({
            "status": "failed", "error": user_msg,
            "finished_at": _now(), "updated_at": _now(),
        }).eq("id", job_id).execute()
        kind = "permanent" if permanent else f"after {attempts} attempts"
        print(f"[job {job_id}] FAILED ({kind}): {err.splitlines()[-1] if err else ''}")
    else:
        delay = _backoff_seconds(attempts)
        nxt = (datetime.now(timezone.utc) + timedelta(seconds=delay)).isoformat()
        sb.table("font_jobs").update({
            "status": "queued", "error": user_msg,
            "next_attempt_at": nxt, "updated_at": _now(),
        }).eq("id", job_id).execute()
        print(f"[job {job_id}] transient error (attempt {attempts}), "
              f"retrying in {delay:.0f}s")


def heartbeat(sb: Client) -> None:
    """Update the single-row worker_status so the web app can tell the converter
    is alive (and otherwise surface 'processing delayed')."""
    try:
        sb.table("worker_status").upsert({
            "id": 1, "last_seen_at": _now(),
        }).execute()
    except Exception as e:
        print(f"heartbeat error: {e}")


def claim(sb: Client) -> dict | None:
    res = sb.rpc("claim_font_job").execute()
    rows = res.data or []
    return rows[0] if rows else None


def reap_stale(sb: Client) -> None:
    """Requeue/fail jobs orphaned by a worker that died mid-conversion."""
    try:
        res = sb.rpc("requeue_stale_font_jobs", {
            "p_timeout": STALE_TIMEOUT, "p_max_attempts": MAX_ATTEMPTS,
        }).execute()
        n = res.data or 0
        if n:
            print(f"reaped {n} stale job(s)")
    except Exception as e:
        print(f"reap error: {e}")


def main() -> None:
    sb = _client()
    print(f"font-worker up: bucket={BUCKET} poll={POLL_INTERVAL}s "
          f"method={'potrace' if convert._HAVE_POTRACE else 'cv2'}")
    while True:
        heartbeat(sb)  # surface liveness even while idle
        try:
            job = claim(sb)
        except Exception as e:
            print(f"claim error: {e}")
            time.sleep(POLL_INTERVAL)
            continue
        if not job:
            reap_stale(sb)  # only when there's nothing to do
            time.sleep(POLL_INTERVAL)
            continue
        try:
            process_job(sb, job)
        except ValueError as e:
            # Bad/unreadable input — retrying won't help, so fail fast with a
            # clear, user-facing reason.
            fail_job(sb, job, str(e), permanent=True)
        except Exception:
            # Transient (network, OOM, crash) — retry with backoff.
            fail_job(sb, job, traceback.format_exc())


if __name__ == "__main__":
    main()
