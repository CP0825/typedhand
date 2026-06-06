import {
  LegalPage,
  LegalSection,
  Placeholder,
} from "@/components/layout/LegalPage";

export const metadata = { title: "Datenschutz" };

// DSGVO-structured privacy policy. Correct section structure with placeholders;
// NOT a finished, binding policy. Cookie law references use the TDDDG (which
// replaced the TTDSG). Every concrete fact is a TODO(constantin).
export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p className="rounded-lg bg-yellow-50 px-3 py-2 text-yellow-800">
        Strukturvorlage nach DSGVO — keine fertige, rechtsverbindliche
        Erklärung und keine Rechtsberatung. Vor dem Livegang durch eine
        fachkundige Person (z. B. mit{" "}
        <a
          href="https://www.datenschutz-generator.de"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          datenschutz-generator.de
        </a>{" "}
        und anwaltlicher Prüfung) vervollständigen lassen.
      </p>

      {/* Controller identity = same provider as the Impressum.
          TODO(constantin): assess whether a Datenschutzbeauftragter (Art. 37
          DSGVO) is required; if so, add their contact details. */}
      <LegalSection heading="1. Verantwortlicher">
        <p>
          Constantin Persaud
          <br />
          Lindenstraße 257
          <br />
          40235 Düsseldorf
          <br />
          Deutschland
          <br />
          E-Mail:{" "}
          <a href="mailto:support@typedhand.com" className="underline">support@typedhand.com</a>
        </p>
        <p>
          <Placeholder>Datenschutzbeauftragter (falls erforderlich, Art. 37 DSGVO)</Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm this list matches what the app actually stores
          and keep it in sync as features change. */}
      <LegalSection heading="2. Welche Daten wir verarbeiten">
        <p>Im Rahmen der Nutzung von TypedHand verarbeiten wir insbesondere:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Kontodaten: E-Mail-Adresse, Authentifizierungsdaten.</li>
          <li>
            <strong>Handschriftproben</strong>: die von Nutzer:innen
            hochgeladenen, handschriftlich ausgefüllten Vorlagen (PDF) sowie die
            daraus erzeugten persönlichen Schriftarten (TTF). Hierbei handelt es
            sich um <strong>personenbezogene, identifizierende Daten</strong>{" "}
            (die eigene Handschrift).
          </li>
          <li>Erzeugte Dokumente: exportierte PDF-Dateien.</li>
          <li>Nutzungsdaten: z. B. der monatliche Export-Zähler, Tarif.</li>
          <li>Einwilligungs-/Altersdaten: die Bestätigung, mindestens 16 Jahre alt zu sein, sowie Einwilligungsversion und -zeitpunkt. Das Geburtsdatum wird nur zur Alterskontrolle abgefragt und nach der Prüfung nicht gespeichert.</li>
          <li>Zahlungsdaten: über Stripe abgewickelt (siehe Auftragsverarbeiter).</li>
        </ul>
        {/* TODO(constantin): LEGAL ASSESSMENT — does a person's handwriting count
            as a "besondere Kategorie" / biometric data under Art. 9 DSGVO? If so,
            a stricter legal basis and safeguards apply. Get a lawyer's view. */}
        <p>
          <Placeholder>
            Rechtliche Einordnung der Handschriftdaten (ggf. Art. 9 DSGVO) klären
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm the legal basis assigned to each purpose with
          a lawyer. */}
      <LegalSection heading="3. Zwecke und Rechtsgrundlagen (Art. 6 DSGVO)">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Bereitstellung des Kontos, Erzeugung der Schriftart und Export:
            Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO.
          </li>
          <li>
            Verarbeitung der Handschriftproben: <Placeholder>Vertrag (lit. b) und/oder Einwilligung (lit. a) — prüfen</Placeholder>.
          </li>
          <li>
            Zahlungsabwicklung und Aufbewahrung von Rechnungsdaten:
            rechtliche Verpflichtung, Art. 6 Abs. 1 lit. c DSGVO.
          </li>
          <li>
            Sicherheit/Betrieb (z. B. Missbrauchsvermeidung): berechtigtes
            Interesse, Art. 6 Abs. 1 lit. f DSGVO.
          </li>
          <li>
            Alterskontrolle bei der Registrierung (Art. 8 DSGVO): Personen unter
            16 Jahren werden von der Registrierung ausgeschlossen; berechtigtes
            Interesse an einem rechtskonformen Betrieb, Art. 6 Abs. 1 lit. f DSGVO.
          </li>
        </ul>
      </LegalSection>

      {/* TODO(constantin): for EACH processor below — confirm the actual hosting
          region, sign an Auftragsverarbeitungsvertrag (Art. 28 DSGVO), and link
          it. If data leaves the EU/EEA (e.g. US), document the transfer mechanism
          (EU Standard Contractual Clauses / adequacy decision) per Art. 44 ff. */}
      <LegalSection heading="4. Auftragsverarbeiter und Drittanbieter">
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Supabase</strong> (Datenbank, Authentifizierung, Datei-
            Speicher der Handschriftproben/Schriftarten/Exporte).{" "}
            <Placeholder>Hosting-Region + AVV + ggf. SCCs (Drittlandtransfer)</Placeholder>
          </li>
          <li>
            <strong>Stripe</strong> (Zahlungsabwicklung).{" "}
            <Placeholder>AVV + Drittlandtransfer USA / EU-SCCs dokumentieren</Placeholder>
          </li>
          <li>
            <strong>Vercel</strong> (Hosting der Web-Anwendung).{" "}
            <Placeholder>Hosting-Region + AVV + ggf. SCCs (Drittlandtransfer)</Placeholder>
          </li>
          <li>
            <Placeholder>
              Cloudflare (falls als Tunnel/CDN genutzt) — sonst entfernen
            </Placeholder>
          </li>
        </ul>
      </LegalSection>

      {/* TODO(constantin): confirm concrete retention periods with a lawyer/tax
          advisor (e.g. billing records under § 147 AO / § 257 HGB). */}
      <LegalSection heading="5. Speicherdauer und Löschung">
        <p>
          Konto- und Handschriftdaten speichern wir, solange das Konto besteht.
          Bei Löschung des Kontos werden die hochgeladenen Vorlagen, die erzeugten
          Schriftarten und die gespeicherten Export-PDFs aus dem Datei-Speicher
          entfernt und die zugehörigen Datenbankeinträge gelöscht.
        </p>
        <p>
          <Placeholder>
            Konkrete Aufbewahrungsfristen, insb. gesetzliche Aufbewahrung von
            Rechnungs-/Zahlungsdaten (z. B. § 147 AO, § 257 HGB)
          </Placeholder>
        </p>
      </LegalSection>

      <LegalSection heading="6. Ihre Rechte als betroffene Person">
        <p>
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
          Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
          Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Eine
          erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft
          widerrufen. Es besteht ein Beschwerderecht bei einer Aufsichtsbehörde
          (Art. 77 DSGVO).
        </p>
        <p>
          Einige dieser Rechte können Sie direkt in Ihrem Dashboard ausüben:
          „Meine Daten exportieren“ (Art. 20) und „Konto und Daten löschen“
          (Art. 17).
        </p>
        {/* TODO(constantin): name the competent supervisory authority for your
            registered seat (zuständige Aufsichtsbehörde). */}
        <p>
          <Placeholder>Zuständige Aufsichtsbehörde (nach Firmensitz)</Placeholder>
        </p>
      </LegalSection>

      <LegalSection heading="7. Minderjährige (Art. 8 DSGVO)">
        <p>
          Die für Deutschland geltende Altersgrenze für die wirksame Einwilligung
          in digitale Dienste beträgt 16 Jahre. TypedHand richtet sich
          ausschließlich an Personen ab 16 Jahren. Bei der Registrierung prüfen
          wir das angegebene Geburtsdatum: Personen unter 16 Jahren werden
          serverseitig blockiert, es wird kein Konto angelegt und es werden keine
          personenbezogenen Daten gespeichert. Das Geburtsdatum selbst wird nach
          der Alterskontrolle verworfen und nicht gespeichert; gespeichert wird
          nur die Bestätigung, mindestens 16 Jahre alt zu sein, samt
          Einwilligungsversion und -zeitpunkt.
        </p>
      </LegalSection>

      {/* TODO(constantin): re-confirm at launch that NO non-essential cookies or
          trackers (analytics, ads, A/B, embedded media) are in use. If any are
          added, you MUST add a consent banner under § 25 Abs. 1 TDDDG before
          they run. */}
      <LegalSection heading="8. Cookies (TDDDG)">
        <p>
          TypedHand verwendet ausschließlich technisch notwendige Cookies bzw.
          lokale Speicherung, die für Anmeldung und Sitzung erforderlich sind.
          Diese sind nach § 25 Abs. 2 Nr. 2 TDDDG (Telekommunikation-Digitale-
          Dienste-Datenschutz-Gesetz, ehemals TTDSG) einwilligungsfrei. Es werden
          keine Analyse-, Tracking- oder Marketing-Cookies eingesetzt; daher gibt
          es kein Cookie-Einwilligungsbanner.
        </p>
      </LegalSection>

      <LegalSection heading="9. Änderungen dieser Erklärung">
        <p>
          <Placeholder>Stand der Erklärung und Hinweis auf Aktualisierungen</Placeholder>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
