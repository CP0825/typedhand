"""Offline smoke test for the font-generation worker (M3).

Runs `worker.process_job` against the real sample template PDFs with a fake,
in-memory Supabase client — no network, no live keys. Verifies:
  1. A multi-PDF job produces one TTF upload + one user_fonts row per variant
     and marks the job 'done' with the right font_ids/metadata.
  2. A PDF that yields no glyphs raises a *catchable* ValueError (not
     SystemExit) so the worker loop fails the job instead of crashing.
  3. fail_job requeues under MAX_ATTEMPTS and marks 'failed' once exhausted.

Run:  python test_worker.py        (from font-worker/)
Needs the dev samples at ~/Downloads/{12,21}.pdf (see memory).
"""
from __future__ import annotations
import os, sys, uuid

import fitz  # PyMuPDF, already a dep
import worker

HOME = os.path.expanduser("~")
SAMPLE_12 = os.path.join(HOME, "Downloads", "12.pdf")
SAMPLE_21 = os.path.join(HOME, "Downloads", "21.pdf")


class FakeStorageBucket:
    def __init__(self, files: dict[str, bytes], uploads: dict[str, bytes]):
        self._files = files       # path -> bytes (pre-seeded source PDFs)
        self.uploads = uploads    # path -> bytes (captured TTF uploads)

    def download(self, path):
        return self._files[path]

    def upload(self, path, data, opts=None):
        assert path not in self.uploads, f"double upload to {path}"
        self.uploads[path] = data
        return {"path": path}


class FakeStorage:
    def __init__(self, bucket):
        self._bucket = bucket

    def from_(self, _name):
        return self._bucket


class FakeQuery:
    def __init__(self, sink, payload):
        self._sink, self._payload = sink, payload

    def eq(self, *_):
        return self

    def execute(self):
        self._sink.append(self._payload)
        return type("R", (), {"data": [self._payload]})()


class FakeTable:
    def __init__(self, name, inserts, updates):
        self._name, self._inserts, self._updates = name, inserts, updates

    def insert(self, payload):
        return FakeQuery(self._inserts.setdefault(self._name, []), payload)

    def update(self, payload):
        return FakeQuery(self._updates.setdefault(self._name, []), payload)


class FakeSupabase:
    def __init__(self, source_files):
        self.uploads: dict[str, bytes] = {}
        self.storage = FakeStorage(FakeStorageBucket(source_files, self.uploads))
        self.inserts: dict[str, list] = {}
        self.updates: dict[str, list] = {}

    def table(self, name):
        return FakeTable(name, self.inserts, self.updates)


def _read(path) -> bytes:
    with open(path, "rb") as f:
        return f.read()


def _blank_pdf_bytes() -> bytes:
    doc = fitz.open()
    doc.new_page()  # one empty page -> no ink -> no glyphs
    return doc.tobytes()


def test_multi_variant_job():
    assert os.path.exists(SAMPLE_12) and os.path.exists(SAMPLE_21), (
        "missing dev sample PDFs ~/Downloads/{12,21}.pdf")
    user_id = str(uuid.uuid4())
    src1 = f"{user_id}/sources/{uuid.uuid4()}.pdf"
    src2 = f"{user_id}/sources/{uuid.uuid4()}.pdf"
    sb = FakeSupabase({src1: _read(SAMPLE_12), src2: _read(SAMPLE_21)})
    job = {"id": str(uuid.uuid4()), "user_id": user_id,
           "name": "Connys Hand", "source_paths": [src1, src2], "attempts": 1}

    worker.process_job(sb, job)

    assert len(sb.uploads) == 2, f"expected 2 TTF uploads, got {len(sb.uploads)}"
    for path, data in sb.uploads.items():
        assert path.startswith(f"{user_id}/fonts/") and path.endswith(".ttf")
        assert data[:4] in (b"\x00\x01\x00\x00", b"true", b"OTTO"), "not a TTF"
    rows = sb.inserts.get("user_fonts", [])
    assert len(rows) == 2, f"expected 2 user_fonts rows, got {len(rows)}"
    for r in rows:
        assert r["status"] == "ready" and r["font_path"] and r["glyph_count"]
        assert r["job_id"] == job["id"] and r["variant_index"] in (1, 2)
        assert isinstance(r["codepoints"], list) and r["codepoints"]
    done = sb.updates.get("font_jobs", [])[-1]
    assert done["status"] == "done" and len(done["font_ids"]) == 2
    # Multi-variant -> distinct family names so the editor can mix them.
    fams = {r["name"] for r in rows}
    assert len(fams) == 2, f"variant families not distinct: {fams}"
    print(f"[ok] multi-variant: 2 TTFs, 2 rows, families={sorted(fams)}, "
          f"glyphs={[r['glyph_count'] for r in rows]}")


def test_bad_pdf_is_catchable():
    user_id = str(uuid.uuid4())
    src = f"{user_id}/sources/{uuid.uuid4()}.pdf"
    sb = FakeSupabase({src: _blank_pdf_bytes()})
    job = {"id": str(uuid.uuid4()), "user_id": user_id,
           "name": "Blank", "source_paths": [src], "attempts": 1}
    caught = None
    try:
        worker.process_job(sb, job)
    except SystemExit:  # the bug we fixed
        raise AssertionError("convert raised SystemExit — would crash the worker")
    except Exception as e:  # noqa: BLE001 — exactly what the worker loop catches
        caught = type(e).__name__
        worker.fail_job(sb, job, str(e))
    assert caught is not None, "expected a blank PDF to fail conversion"
    upd = sb.updates.get("font_jobs", [])[-1]
    # attempts(1) < MAX_ATTEMPTS(3) -> requeued, not failed.
    assert upd["status"] == "queued", f"expected requeue, got {upd['status']}"
    print(f"[ok] bad PDF: caught {caught}, job requeued (not crashed)")


def test_fail_after_max_attempts():
    sb = FakeSupabase({})
    job = {"id": str(uuid.uuid4()), "user_id": "u",
           "name": "x", "source_paths": [], "attempts": worker.MAX_ATTEMPTS}
    worker.fail_job(sb, job, "boom")
    upd = sb.updates.get("font_jobs", [])[-1]
    assert upd["status"] == "failed" and upd["error"]
    print(f"[ok] exhausted attempts -> failed")


if __name__ == "__main__":
    test_multi_variant_job()
    test_bad_pdf_is_catchable()
    test_fail_after_max_attempts()
    print("\nALL PASS")
