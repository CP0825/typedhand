// One-off admin helper: create a confirmed user at a given tier.
//
//   node scripts/create-user.mjs <email> <password> [free|student|pro]
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Uses the service-role key (bypasses RLS) — never expose this client-side.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(here, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const [email, password, tier = "free"] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: node scripts/create-user.mjs <email> <password> [tier]");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}
const userId = data.user.id;
console.log("created auth user:", userId, email);

// The handle_new_user trigger inserts the profile row; set the requested tier.
const { error: upErr } = await supabase
  .from("profiles")
  .update({ tier })
  .eq("id", userId);
if (upErr) {
  console.error("tier update failed:", upErr.message);
  process.exit(1);
}
console.log(`profile set to tier='${tier}'. Done.`);
