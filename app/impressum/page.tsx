import {
  LegalPage,
  LegalSection,
  Placeholder,
} from "@/components/layout/LegalPage";

export const metadata = { title: "Impressum" };

// Structure follows § 5 DDG (Digitale-Dienste-Gesetz, which replaced § 5 TMG on
// 14 May 2024) and § 18 MStV (which replaced § 55 RStV). Provider identity is
// filled in; only the contact email remains a TODO(constantin). This is NOT
// legal advice.
export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <p className="rounded-lg bg-yellow-50 px-3 py-2 text-yellow-800">
        Angaben gemäß § 5 DDG. Dies ist keine Rechtsberatung.
      </p>

      <LegalSection heading="Diensteanbieter">
        <p>
          Constantin Persaud
          <br />
          Lindenstraße 257
          <br />
          40235 Düsseldorf
          <br />
          Deutschland
        </p>
      </LegalSection>

      {/* § 5 DDG requires a way to contact the provider quickly and
          electronically. Constantin will supply the contact email before launch;
          consider adding a second channel (phone or contact form) as well. */}
      <LegalSection heading="Kontakt">
        <p>
          E-Mail:{" "}
          <a href="mailto:support@typedhand.com" className="underline">support@typedhand.com</a>
        </p>
      </LegalSection>

      {/* USt-IdNr. intentionally omitted — not applicable. */}

      <LegalSection heading="Verantwortlich für journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV)">
        <p>
          Constantin Persaud
          <br />
          Lindenstraße 257
          <br />
          40235 Düsseldorf
          <br />
          Deutschland
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm whether you participate in / are obliged to
          participate in consumer dispute resolution (§ 36 VSBG) and state it. */}
      <LegalSection heading="EU-Streitschlichtung / Verbraucherstreitbeilegung">
        <p>
          Plattform der EU-Kommission zur Online-Streitbeilegung (OS):{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p>
          <Placeholder>
            Hinweis nach § 36 VSBG: ob/inwieweit zur Teilnahme an einem
            Streitbeilegungsverfahren bereit oder verpflichtet
          </Placeholder>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
