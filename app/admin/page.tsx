import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TierBadge } from "@/components/ui/Badge";
import type { Tier } from "@/lib/constants";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

interface SignupRow {
  email: string;
  tier: Tier;
  created_at: string;
}
interface ExportRow {
  export_type: string;
  font_used: string;
  created_at: string;
  user_id: string;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/editor");

  const admin = createAdminClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    freeCount,
    studentCount,
    proCount,
    monthExports,
    recentSignups,
    recentExports,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("tier", "free"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("tier", "student"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("tier", "pro"),
    admin
      .from("exports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    admin
      .from("profiles")
      .select("email, tier, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("exports")
      .select("export_type, font_used, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const exportRows = (recentExports.data ?? []) as ExportRow[];
  const userIds = Array.from(new Set(exportRows.map((e) => e.user_id)));
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    (users ?? []).forEach((u: { id: string; email: string }) =>
      emailMap.set(u.id, u.email),
    );
  }

  const free = freeCount.count ?? 0;
  const student = studentCount.count ?? 0;
  const pro = proCount.count ?? 0;

  const stats = [
    { label: "Total users", value: free + student + pro },
    { label: "Free", value: free },
    { label: "Student", value: student },
    { label: "Pro", value: pro },
    { label: "Exports this month", value: monthExports.count ?? 0 },
  ];

  const signups = (recentSignups.data ?? []) as SignupRow[];

  return (
    <>
      <Navbar />
      <div className="bg-th-void">
        <main className="mx-auto max-w-content px-5 py-10">
          <h1 className="mb-6 text-2xl font-semibold text-th-editor-text">Admin</h1>

          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-th-editor-border bg-th-surface p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-th-editor-muted">
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-th-editor-text">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="mb-3 text-base font-semibold text-th-editor-text">
              Recent sign-ups
            </h2>
            <Table
              head={["Email", "Tier", "Joined"]}
              rows={signups.map((s) => [
                s.email,
                <TierBadge key={s.email} tier={s.tier} />,
                fmt(s.created_at),
              ])}
              empty="No sign-ups yet."
            />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-th-editor-text">
              Recent exports
            </h2>
            <Table
              head={["User", "Type", "Font", "When"]}
              rows={exportRows.map((e) => [
                emailMap.get(e.user_id) ?? "—",
                e.export_type.toUpperCase(),
                e.font_used,
                fmt(e.created_at),
              ])}
              empty="No exports yet."
            />
          </section>
        </main>
      </div>
    </>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-th-editor-border bg-th-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-th-editor-border text-xs uppercase tracking-wide text-th-editor-muted">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-8 text-center text-th-editor-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((cells, r) => (
              <tr key={r} className="border-b border-th-editor-border last:border-0">
                {cells.map((c, i) => (
                  <td key={i} className="px-4 py-3 text-th-editor-text">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
