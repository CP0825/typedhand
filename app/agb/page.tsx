import {
  LegalPage,
  LegalSection,
  Placeholder,
} from "@/components/layout/LegalPage";

export const metadata = { title: "AGB" };

// Correct section structure for B2C subscription terms. NOT binding legal text —
// every clause needs lawyer review (TODO(constantin)). The Widerrufsbelehrung in
// particular must be drafted by a lawyer with the statutory Muster-Widerrufsformular.
export default function AGBPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <p className="rounded-lg bg-yellow-50 px-3 py-2 text-yellow-800">
        Strukturvorlage — keine rechtsverbindlichen AGB und keine
        Rechtsberatung. Vor dem Livegang anwaltlich prüfen und vervollständigen
        lassen (insb. Widerrufsbelehrung, Haftung, Preise).
      </p>

      {/* TODO(constantin): lawyer review of the ENTIRE document required. */}
      <LegalSection heading="1. Geltungsbereich">
        <p>
          <Placeholder>
            Diese AGB gelten für die Nutzung von TypedHand unter typedhand.com
            durch Verbraucher und Unternehmer
          </Placeholder>
        </p>
      </LegalSection>

      {/* Plan limits below are the actual product limits; confirm wording with a
          lawyer and keep in sync with lib/tier-logic.ts. */}
      <LegalSection heading="2. Vertragsgegenstand und Leistungsbeschreibung">
        <p>
          TypedHand wandelt getippten Text in die eigene, zuvor hochgeladene
          Handschrift der Nutzer:innen um und ermöglicht den PDF-Export. Es
          gelten je Tarif folgende Grenzen:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Free: 1 PDF-Export/Monat, 1 Schriftart, mit Wasserzeichen.</li>
          <li>Student: 5 PDF-Exporte/Monat, bis zu 5 Schriftarten, ohne Wasserzeichen.</li>
          <li>Pro: unbegrenzte, mehrseitige PDF-Exporte, bis zu 10 Schriftarten.</li>
        </ul>
        <p>
          <Placeholder>Verfügbarkeit/Leistungsumfang verbindlich beschreiben</Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): describe account registration and email confirmation.
          Mindestalter: TypedHand is only for users aged 16+; under-16 users are
          blocked at signup (Art. 8 DSGVO) — see signup/age gate. No minor
          accounts are created, so no parental-consent flow is needed. */}
      <LegalSection heading="3. Registrierung und Vertragsschluss">
        <p>
          <Placeholder>
            Ablauf der Registrierung, E-Mail-Bestätigung und Hinweis, dass die
            Nutzung ein Mindestalter von 16 Jahren voraussetzt (unter 16 Jahren
            ist keine Registrierung möglich)
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm prices incl. VAT, billing cycle and renewal
          (monthly and annual). */}
      <LegalSection heading="4. Preise und Zahlung">
        <p>
          <Placeholder>
            Student €2,99/Monat oder €19,99/Jahr, Pro €5,99/Monat oder
            €34,99/Jahr (Preisangaben inkl. USt. prüfen), Abrechnung über Stripe,
            automatische Verlängerung je nach gewähltem Abrechnungszeitraum
            (monatlich/jährlich)
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm term, notice period and renewal comply with
          §§ 309 Nr. 9, 312k BGB (incl. the Kündigungsbutton requirement). */}
      <LegalSection heading="5. Laufzeit und Kündigung">
        <p>
          <Placeholder>
            Monatliche Laufzeit, jederzeit zum Ende des Abrechnungszeitraums über
            das Dashboard kündbar, keine Mindestlaufzeit
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): a lawyer MUST draft the Widerrufsbelehrung and the
          Muster-Widerrufsformular. For paid digital services, decide how to
          handle § 356 Abs. 5 BGB (consumer's express consent to begin before the
          14-day period ends, acknowledging loss of the Widerrufsrecht). */}
      <LegalSection heading="6. Widerrufsrecht für Verbraucher">
        <p>
          <Placeholder>
            Vollständige Widerrufsbelehrung (14 Tage) inkl. Muster-Widerrufs-
            formular und Regelung zu vorzeitigem Leistungsbeginn (§ 356 Abs. 5 BGB)
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm IP wording with a lawyer. */}
      <LegalSection heading="7. Inhalte und Nutzungsrechte">
        <p>
          <Placeholder>
            Die hochgeladene Handschrift und die erzeugten Schriftarten bleiben
            den Nutzer:innen zugeordnet; Rechteeinräumung an TypedHand nur, soweit
            zur Leistungserbringung erforderlich
          </Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): acceptable-use / prohibited-use clauses. */}
      <LegalSection heading="8. Pflichten der Nutzer:innen">
        <p>
          <Placeholder>Zulässige Nutzung, verbotene Nutzung, Folgen bei Verstößen</Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): liability limitations must be drafted by a lawyer. */}
      <LegalSection heading="9. Haftung">
        <p>
          <Placeholder>Haftungsbeschränkungen nach deutschem Recht</Placeholder>
        </p>
      </LegalSection>

      {/* TODO(constantin): confirm change-of-terms mechanism is enforceable. */}
      <LegalSection heading="10. Änderungen der AGB">
        <p>
          <Placeholder>Verfahren zur Änderung dieser AGB und Zustimmungsfiktion</Placeholder>
        </p>
      </LegalSection>

      <LegalSection heading="11. Anwendbares Recht, Gerichtsstand, Streitbeilegung">
        <p>
          <Placeholder>
            Anwendbares Recht (deutsches Recht), Gerichtsstand, Hinweis auf die
            EU-OS-Plattform und § 36 VSBG (siehe Impressum)
          </Placeholder>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
