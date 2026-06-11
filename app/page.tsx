import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { PricingPlans } from "@/components/landing/PricingPlans";

const STEPS = [
  {
    icon: "✍️",
    title: "Make your handwriting",
    body: "Download a template PDF and fill it in on your iPad with Apple Pencil — in Goodnotes, Notability or Files — then upload it. We turn it into your own personal font. No printer or scanner needed.",
  },
  {
    icon: "⌨️",
    title: "Type anything",
    body: "Type or paste your text and watch it appear in your own handwriting. Tune size, spacing, slant and messiness live.",
  },
  {
    icon: "📄",
    title: "Export a PDF",
    body: "Download a clean PDF on real A4 — share it online, or print your finished letter at home.",
  },
];

const FAQ = [
  {
    q: "Whose handwriting is it?",
    a: "Yours. You fill in a short template once on your iPad with Apple Pencil, and we turn it into your personal font — so everything you type comes out in your own writing.",
  },
  {
    q: "What can I use it for?",
    a: "Personal cards, letters and journals; addressed envelopes and gifts; language practice; classroom worksheets; and writing by hand when a motor or writing difficulty such as dysgraphia or RSI makes it hard.",
  },
  {
    q: "Do I need a printer or scanner?",
    a: "No. The whole flow is digital: download the template PDF, fill it in on your iPad with Apple Pencil in Goodnotes, Notability or Files, export it as a PDF, and upload it. Nothing is ever printed or scanned.",
  },
  {
    q: "Can I use it on iPad?",
    a: "Yes — it's built for iPad. You make your handwriting with Apple Pencil, and the editor is fully browser-based and works on any device.",
  },
  {
    q: "What languages does it support?",
    a: "Any language written in the Latin alphabet. Pro adds dedicated Spanish and French templates with their accented characters.",
  },
  {
    q: "How do I cancel?",
    a: "Anytime, in one click, from your dashboard. No hidden fees.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-content px-5 pb-16 pt-12 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-up">
            <Badge>Your own handwriting</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-th-ink sm:text-5xl">
              Your handwriting.
              <br />
              Typed.
            </h1>
            <p className="mt-4 max-w-md text-lg text-th-ink-mid">
              Turn your real handwriting into a font, then type anything and get
              it back in your own hand — ready to export as a clean PDF.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/signup" size="lg">
                Start for free
              </LinkButton>
              <LinkButton href="/login" variant="secondary" size="lg">
                I have an account
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-th-ink-light">
              No card required · 1 free PDF export every month
            </p>
          </div>

          <div className="animate-fade-up">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ── How it works — same white background as everything else ── */}
      <section className="border-y border-th-dusty/40">
        <div className="mx-auto max-w-content px-5 py-16">
          <h2 className="text-center text-2xl font-semibold text-th-ink">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-th-dusty/40 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-th-forest/8 text-2xl">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-th-ink">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-th-ink-mid">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-content px-5 py-16">
        <h2 className="text-center text-2xl font-semibold text-th-ink">
          Simple pricing
        </h2>
        <p className="mt-2 text-center text-th-ink-mid">
          Start free. Upgrade when you need more — save with annual billing.
        </p>

        <PricingPlans />
      </section>

      {/* ── What it's for ──────────────────────────────────────────── */}
      {/* TODO(constantin): add real social proof (user count or testimonials)
          here once available — do not fabricate a number. */}
      <section className="border-y border-th-dusty/40">
        <div className="mx-auto max-w-content px-5 py-14 text-center">
          <p className="text-xl font-medium text-th-ink">
            Real handwriting — yours, not a generic font.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-th-ink-mid">
            For cards and letters, journals and gifts, language practice,
            classroom worksheets — and for writing by hand when it isn&apos;t
            easy, from dysgraphia to RSI.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-5 py-16">
        <h2 className="text-center text-2xl font-semibold text-th-ink">
          Frequently asked
        </h2>
        <div className="mt-8 divide-y divide-th-dusty/50">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-th-ink">
                {item.q}
                <span className="text-th-ink-light transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-th-ink-mid">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-th-ink px-6 py-10 text-center">
          <h3 className="text-xl font-semibold text-th-canvas">
            Ready to write?
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-th-canvas/70">
            Create your free account, set up your handwriting, and get your
            first PDF in minutes.
          </p>
          <div className="mt-6 flex justify-center">
            <LinkButton href="/signup" variant="action" size="lg">
              Start for free
            </LinkButton>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
