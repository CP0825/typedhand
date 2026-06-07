import {
  LegalPage,
  LegalSection,
} from "@/components/layout/LegalPage";

export const metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
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
          <a href="mailto:support@typedhand.com" className="underline">
            support@typedhand.com
          </a>
        </p>
        <p>Ein Datenschutzbeauftragter ist derzeit nicht bestellt.</p>
      </LegalSection>

      <LegalSection heading="2. Welche Daten wir verarbeiten">
        <p>Im Rahmen der Nutzung von TypedHand verarbeiten wir insbesondere:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Kontodaten: E-Mail-Adresse, Authentifizierungsdaten.</li>
          <li>
            <strong>Handschriftproben</strong>: die von Nutzer:innen hochgeladenen,
            handschriftlich ausgefüllten Vorlagen (PDF), die ausschließlich zur
            Erzeugung einer persönlichen Schriftart verarbeitet werden. Hierbei
            handelt es sich um personenbezogene Daten.
          </li>
          <li>
            Erzeugte Dokumente: exportierte PDF-Dateien, soweit sie im Rahmen der
            Nutzung erzeugt werden.
          </li>
          <li>Nutzungsdaten: z. B. monatlicher Export-Zähler, Tarif.</li>
          <li>
            Einwilligungs-/Altersdaten: die Bestätigung, mindestens 16 Jahre alt
            zu sein, sowie Einwilligungsversion und -zeitpunkt. Das Geburtsdatum
            wird nur zur Alterskontrolle abgefragt und nach der Prüfung nicht
            gespeichert.
          </li>
          <li>
            Zahlungsdaten: über Stripe abgewickelt.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Zwecke und Rechtsgrundlagen (Art. 6 DSGVO)">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Bereitstellung des Kontos, Erzeugung der Schriftart und Export:
            Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO.
          </li>
          <li>
            Verarbeitung der Handschriftproben zur Erstellung der individuellen
            Schriftart: Art. 6 Abs. 1 lit. b DSGVO; soweit erforderlich,
            ausdrückliche Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO.
          </li>
          <li>
            Zahlungsabwicklung und Aufbewahrung von Rechnungsdaten:
            rechtliche Verpflichtung, Art. 6 Abs. 1 lit. c DSGVO.
          </li>
          <li>
            Sicherheit und Betrieb der Anwendung, insbesondere Missbrauchs- und
            Fehlervermeidung: berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO.
          </li>
          <li>
            Alterskontrolle bei der Registrierung: berechtigtes Interesse an
            einem rechtskonformen Betrieb, Art. 6 Abs. 1 lit. f DSGVO.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Auftragsverarbeiter und Drittanbieter">
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Supabase</strong> (Datenbank, Authentifizierung, Dateispeicher
            der Handschriftproben, Schriftarten und Exporte). Verarbeitung und
            Speicherung innerhalb der EU/EWR.
          </li>
          <li>
            <strong>Stripe</strong> (Zahlungsabwicklung). Verarbeitung im Rahmen
            der Zahlungsabwicklung innerhalb der EU/EWR.
          </li>
          <li>
            <strong>Vercel</strong> (Hosting der Web-Anwendung). Verarbeitung und
            Speicherung innerhalb der EU/EWR.
          </li>
          <li>
            <strong>Cloudflare</strong> (Tunnel/CDN/Sicherheitsfunktionen, sofern
            eingesetzt). Verarbeitung und Speicherung innerhalb der EU/EWR.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Speicherdauer und Löschung">
        <p>
          Konto- und Handschriftdaten speichern wir, solange das Konto besteht.
          Nach Löschung des Kontos werden alle zugehörigen Daten innerhalb von 14
          Tagen vollständig gelöscht, einschließlich hochgeladener Vorlagen,
          erzeugter Schriftarten und gespeicherter Export-PDFs.
        </p>
        <p>
          Rechnungs- und buchungsrelevante Unterlagen speichern wir aufgrund
          gesetzlicher Aufbewahrungspflichten für 10 Jahre und löschen sie
          anschließend.
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
        <p>
          Zuständige Aufsichtsbehörde: Landesbeauftragte für Datenschutz und
          Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße
          2–4, 40213 Düsseldorf.
        </p>
      </LegalSection>

      <LegalSection heading="7. Minderjährige (Art. 8 DSGVO)">
        <p>
          TypedHand richtet sich ausschließlich an Personen ab 16 Jahren. Bei
          der Registrierung prüfen wir das angegebene Geburtsdatum. Personen
          unter 16 Jahren werden serverseitig blockiert, es wird kein Konto
          angelegt und es werden keine personenbezogenen Daten gespeichert. Das
          Geburtsdatum selbst wird nach der Alterskontrolle verworfen und nicht
          gespeichert; gespeichert wird nur die Bestätigung, mindestens 16 Jahre
          alt zu sein, samt Einwilligungsversion und -zeitpunkt.
        </p>
      </LegalSection>

      <LegalSection heading="8. Cookies und lokale Speicherung (TDDDG)">
        <p>
          TypedHand verwendet keine Analyse-, Tracking- oder Marketing-Cookies.
          Es werden nur technisch erforderliche Speicherungen oder Zugriffe
          eingesetzt, soweit sie für Anmeldung und Sitzungssicherheit notwendig
          sind. Ein Cookie-Einwilligungsbanner ist deshalb nicht erforderlich.
        </p>
      </LegalSection>

      <LegalSection heading="9. Änderungen dieser Erklärung">
        <p>Stand der Erklärung: Juni 2026.</p>
        <p>Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage, die
        eingesetzten Dienste oder unsere Datenverarbeitung ändern.</p>
      </LegalSection>
    </LegalPage>
  );
}
