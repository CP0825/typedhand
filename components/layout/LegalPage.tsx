import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-2xl px-5 py-12">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <div className="prose-legal mt-6 space-y-5 text-sm leading-relaxed text-ink/75">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// Visible marker for content that must be filled in before launch.
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-yellow-100 px-1.5 py-0.5 font-mono text-xs text-yellow-800">
      [PLACEHOLDER: {children}]
    </span>
  );
}
