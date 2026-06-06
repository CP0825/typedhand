"""TEMP M5 seed: flip the account to Pro, upload a filled sample template to the
personal-fonts bucket, and enqueue a font_jobs row — exactly mirroring what
app/api/fonts/generate/route.ts does server-side. Delete after the M5 run."""
import os, sys, uuid
from supabase import create_client

URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
EMAIL = "constantin@persaud.de"
BUCKET = "personal-fonts"
SRC_PDF = os.path.expanduser("~/Downloads/12.pdf")  # filled standard_de sample

sb = create_client(URL, KEY)

# Resolve the user id by email.
prof = sb.table("profiles").select("id,tier,is_admin").eq("email", EMAIL).single().execute()
uid = prof.data["id"]
print(f"user={uid} tier_before={prof.data['tier']} admin_before={prof.data['is_admin']}")

# Flip to Pro so the real Pro flow is exercisable (no admin elevation needed).
sb.table("profiles").update({"tier": "pro"}).eq("id", uid).execute()
print("tier -> pro")

# Upload the source PDF to <uid>/sources/<uuid>.pdf.
path = f"{uid}/sources/{uuid.uuid4()}.pdf"
with open(SRC_PDF, "rb") as fh:
    data = fh.read()
sb.storage.from_(BUCKET).upload(path, data, {"content-type": "application/pdf"})
print(f"uploaded source ({len(data)} bytes) -> {path}")

# Enqueue the job.
job = sb.table("font_jobs").insert({
    "user_id": uid,
    "name": "M5 Test Hand (sample 12)",
    "status": "queued",
    "source_paths": [path],
}).select("id,status").single().execute()
print(f"JOB_ID={job.data['id']} status={job.data['status']}")
