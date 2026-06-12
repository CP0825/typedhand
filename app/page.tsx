import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingWords } from "@/components/landing/RotatingWords";
import { UseCaseMarquee } from "@/components/landing/UseCaseMarquee";
import {
  ArrowDoodle,
  LoopDoodle,
  PlaneDoodle,
  SparkleDoodle,
  SquiggleUnderline,
} from "@/components/landing/Doodles";
import { HANDWRITING_VARIANTS } from "@/lib/fonts";

const STEPS = [
  {
    icon: "✍️",
    title: "Make your handwriting",
    body: "Download a template PDF and fill it in on your iPad with Apple Pencil — in Goodnotes, Notability or Files — then upload it. We turn it into your own personal font. No printer or scanner needed.",
    bar: "from-th-forest to-[#5d8a72]",
    tile: "from-th-forest/15 via-th-forest/5 to-th-amber/10",
  },
  {
    icon: "⌨️",
    title: "Type anything",
    body: "Type or paste your text and watch it appear in your own handwriting. Tune size, spacing, slant and messiness live.",
    bar: "from-[#5d8a72] via-th-amber/80 to-th-amber",
    tile: "from-th-amber/15 via-th-amber/5 to-th-forest/10",
  },
  {
    icon: "📄",
    title: "Export a PDF",
    body: "Download a clean PDF on real A4 — share it online, or print your finished letter at home.",
    bar: "from-th-amber to-[#d9a13d]",
    tile: "from-th-forest/10 via-th-amber/10 to-th-forest/15",
  },
];

const USE_CASES = [
  { icon: "💌", label: "love letters", note: "say it like you mean it" },
  { icon: "📚", label: "study notes", note: "make revision yours" },
  { icon: "✉️", label: "penpal letters", note: "without the hand cramp" },
  { icon: "🎁", label: "gift tags", note: "personal in seconds" },
  { icon: "🌍", label: "language practice", note: "Spanish & French accents too" },
  { icon: "🧑‍🏫", label: "worksheets", note: "teachers' secret weapon" },
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

// Shared section header: handwriting kicker + bold title. The kicker uses the
// same handwriting variants as the demo, so it doubles as product proof.
function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="text-center">
      <p
        className="text-2xl text-th-forest"
        style={{ fontFamily: HANDWRITING_VARIANTS[2] }}
      >
        {kicker}
      </p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-th-ink sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-th-ink-mid">{sub}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hero-paper pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-24 right-[6%] h-72 w-72 rounded-full bg-th-forest/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-44 h-64 w-64 rounded-full bg-th-amber/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-content px-5 pb-20 pt-12 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <Badge>✨ Your own handwriting</Badge>
              <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-th-ink sm:text-5xl lg:text-6xl">
                Your handwriting.
                <br />
                <span className="hl-swipe">Typed.</span>
              </h1>
              <SquiggleUnderline
                className="mt-3 h-5 w-44 text-th-forest/60"
                drawDelay="0.9s"
              />
              <p className="mt-5 max-w-md text-lg text-th-ink-mid">
                Turn your real handwriting into a font, then type anything and
                get it back in your own hand — ready to export as a clean PDF.
              </p>
              <p className="mt-4 text-lg text-th-ink-mid">
                Perfect for&nbsp;
                <RotatingWords />
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <LinkButton href="/signup" size="lg" className="group hover:-translate-y-0.5">
                  Start for free
                  <span
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  >
                    →
                  </span>
                </LinkButton>
                <LinkButton href="/login" variant="secondary" size="lg">
                  I have an account
                </LinkButton>
              </div>
              <p className="mt-4 text-sm text-th-ink-light">
                No card required · 1 free PDF export every month
              </p>
            </div>

            <div className="relative animate-fade-up">
              <ArrowDoodle
                className="absolute -top-12 left-2 hidden h-16 w-16 rotate-[14deg] text-th-amber lg:block"
                drawDelay="1.3s"
              />
              <SparkleDoodle
                className="doodle-float absolute -right-3 -top-6 hidden h-7 w-7 text-th-forest/50 lg:block"
                drawDelay="1.6s"
              />
              <HeroDemo />
              <LoopDoodle
                className="absolute -bottom-9 right-6 hidden h-9 w-20 text-th-forest/40 lg:block"
                drawDelay="1.9s"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Use-case marquee — the handwriting fonts are already loaded ── */}
      <UseCaseMarquee />

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-th-forest/[0.07] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-th-amber/[0.08] blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-content px-5 py-20">
          <Reveal>
            <SectionHeading kicker="three steps, no scanner" title="How it works" />
          </Reveal>
          <div className="relative mt-12">
            {/* Dashed connector behind the step icons (visible in the gaps). */}
            <div
              className="absolute left-[14%] right-[14%] top-[52px] hidden border-t-2 border-dashed border-th-forest/25 sm:block"
              aria-hidden
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 130} className="h-full">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-th-dusty/40 bg-gradient-to-b from-white to-[#fbfaf6] p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-24px_rgba(28,25,23,0.3)]">
                    {/* Per-step gradient edge along the top. */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`}
                      aria-hidden
                    />
                    <span
                      className="absolute left-4 top-2 bg-gradient-to-br from-th-forest/25 to-th-amber/20 bg-clip-text text-3xl font-black text-transparent"
                      aria-hidden
                    >
                      0{i + 1}
                    </span>
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl ring-1 ring-th-forest/15 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${s.tile}`}
                    >
                      {s.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-th-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-th-ink-mid">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="border-y border-th-dusty/40 bg-gradient-to-b from-th-parchment/30 via-white/70 to-th-parchment/30"
      >
        <div className="mx-auto max-w-content px-5 py-20">
          <Reveal>
            <SectionHeading
              kicker="no surprises"
              title="Simple pricing"
              sub="Start free. Upgrade when you need more — save with annual billing."
            />
          </Reveal>
          <PricingPlans />
        </div>
      </section>

      {/* ── What it's for ──────────────────────────────────────────── */}
      {/* TODO(constantin): add real social proof (user count or testimonials)
          here once available — do not fabricate a number. */}
      <section>
        <div className="mx-auto max-w-content px-5 py-20">
          <Reveal>
            <SectionHeading
              kicker="made for real life"
              title="Real handwriting — yours."
              sub="Not a generic 'handwriting font'. Every letter comes from the template you filled in, with natural variation on every character."
            />
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.label} delay={i * 70} className="h-full">
                <div
                  className={`flex h-full flex-col items-center gap-0.5 rounded-2xl border border-th-dusty/40 bg-white px-4 py-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lg ${
                    i % 2 ? "rotate-[0.8deg]" : "-rotate-[0.8deg]"
                  }`}
                >
                  <span className="text-3xl">{u.icon}</span>
                  <span
                    className="mt-1 text-2xl leading-tight text-th-ink"
                    style={{
                      fontFamily:
                        HANDWRITING_VARIANTS[(i * 2) % HANDWRITING_VARIANTS.length],
                    }}
                  >
                    {u.label}
                  </span>
                  <span className="text-xs text-th-ink-mid">{u.note}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-th-ink-mid">
              …and for writing by hand when it isn&apos;t easy — from dysgraphia
              to RSI.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-2xl px-5 pb-20 pt-4">
        <Reveal>
          <SectionHeading kicker="quick answers" title="Frequently asked" />
        </Reveal>
        <div className="mt-8 divide-y divide-th-dusty/50">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 50}>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-th-ink transition-colors hover:text-th-forest">
                  {item.q}
                  <span className="text-th-ink-light transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="faq-body mt-2 text-sm leading-relaxed text-th-ink-mid">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="relative mt-12 overflow-hidden rounded-3xl bg-th-ink px-6 py-12 text-center">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[30rem] -translate-x-1/2 rounded-full bg-th-forest/50 blur-3xl"
              aria-hidden
            />
            <PlaneDoodle
              className="doodle-float absolute right-7 top-6 h-10 w-16 text-[#d9a13d]/80"
              drawDelay="0.5s"
            />
            <SparkleDoodle
              className="doodle-float absolute bottom-7 left-7 h-6 w-6 text-th-canvas/40"
              drawDelay="0.8s"
            />
            <p
              className="relative text-2xl text-[#d9a13d]"
              style={{ fontFamily: HANDWRITING_VARIANTS[4] }}
            >
              go on, write something
            </p>
            <h3 className="relative mt-2 text-2xl font-bold text-th-canvas sm:text-3xl">
              Ready to write?
            </h3>
            <p className="relative mx-auto mt-2 max-w-sm text-sm text-th-canvas/70">
              Create your free account, set up your handwriting, and get your
              first PDF in minutes.
            </p>
            <div className="relative mt-6 flex justify-center">
              <LinkButton
                href="/signup"
                variant="action"
                size="lg"
                className="hover:-translate-y-0.5"
              >
                Start for free
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
