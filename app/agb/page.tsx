import {
  LegalPage,
  LegalSection,
  Placeholder,
} from "@/components/layout/LegalPage";

export const metadata = { title: "AGB" };

// Strukturvorlage für TypedHand. Keine Rechtsberatung und kein Ersatz für
// anwaltliche Prüfung. Vor dem Livegang unbedingt final prüfen lassen,
// insbesondere Widerruf, Haftung, Verbraucherschutz, Preisangaben, Kündigungs-
/* button, Datenschutzverweise und technische Umsetzung.
 */
export default function AGBPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <p className="rounded-lg bg-yellow-50 px-3 py-2 text-yellow-800">
        Diese Allgemeinen Geschäftsbedingungen gelten für TypedHand, vertreten
        durch Constantin Persaud Einzelunternehmen, Lindenstraße 257, 40235
        Düsseldorf, Deutschland, E-Mail: support@typedhand.com.
      </p>

      <LegalSection heading="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über
          die Nutzung der Plattform TypedHand unter typedhand.com zwischen dem
          Anbieter und Nutzerinnen und Nutzern mit Wohnsitz in Deutschland.
        </p>
        <p>
          Das Angebot richtet sich an Verbraucherinnen und Verbraucher ab einem
          Mindestalter von 16 Jahren. Eine Registrierung und Nutzung unter
          16 Jahren ist nicht möglich.
        </p>
        <p>
          Abweichende Bedingungen der Nutzerinnen und Nutzer finden keine
          Anwendung, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich
          in Textform zu.
        </p>
      </LegalSection>

      <LegalSection heading="2. Vertragsgegenstand und Leistungsbeschreibung">
        <p>
          TypedHand ist eine Software zur Umwandlung von getipptem Text in eine
          von den Nutzerinnen und Nutzern zuvor hochgeladene eigene Handschrift
          sowie zur Erstellung und zum PDF-Export entsprechender Dokumente.
          Eine künstliche Intelligenz wird hierfür nicht eingesetzt; die
          Verarbeitung erfolgt automatisiert durch technische Scripts und
          Programme.
        </p>
        <p>
          Die Nutzerinnen und Nutzer können eine oder mehrere Handschriften
          hochladen, Text eingeben und daraus PDF-Dateien erzeugen. Die erzeugten
          Dateien werden im Nutzerprofil gespeichert und können dort erneut
          aufgerufen, heruntergeladen und verwendet werden, solange das jeweilige
          Nutzerkonto besteht.
        </p>
        <p>
          Eine Garantie für eine identische optische Reproduktion der
          hochgeladenen Handschrift, für fehlerfreie Layout-Ergebnisse oder für
          die Eignung der erzeugten Dateien für einen bestimmten Verwendungszweck
          wird nicht übernommen. Typische Darstellungs- oder Formatabweichungen
          können insbesondere abhängig von Inhalt, Umfang, Endgerät, Browser oder
          PDF-Viewer auftreten.
        </p>
        <p>Je Tarif gelten aktuell folgende Leistungsgrenzen:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Free: unbegrenzte PDF-Exporte mit Wasserzeichen, bis zu 2
            Schriftarten.
          </li>
          <li>
            Plus: unbegrenzte PDF-Exporte ohne Wasserzeichen, bis zu 5
            Schriftarten.
          </li>
          <li>
            Pro: unbegrenzte PDF-Exporte, mehrseitige PDFs, bis zu 10
            Schriftarten, ohne Wasserzeichen.
          </li>
        </ul>
        <p>
          Der genaue Funktionsumfang kann sich innerhalb der vertraglich
          geschuldeten Leistung weiterentwickeln, sofern hierdurch keine
          wesentlichen Kernfunktionen entfallen und keine berechtigten Interessen
          der Nutzerinnen und Nutzer beeinträchtigt werden.
        </p>
      </LegalSection>

      <LegalSection heading="3. Registrierung und Vertragsschluss">
        <p>
          Für die Nutzung ist ein Nutzerkonto erforderlich. Die Registrierung
          erfolgt durch Eingabe der vorgesehenen Daten und Abschluss des
          Registrierungs- beziehungsweise Bestellvorgangs.
        </p>
        <p>
          Vor Abschluss des Vertrags erhalten die Nutzerinnen und Nutzer die
          Möglichkeit, ihre Angaben zu prüfen und zu ändern. Der Vertrag kommt
          zustande, sobald der Bestellvorgang erfolgreich abgeschlossen und die
          Zahlung autorisiert wurde beziehungsweise bei kostenlosen Tarifen mit
          Abschluss der Registrierung.
        </p>
        <p>
          Die Registrierung ist nur Personen gestattet, die das 16. Lebensjahr
          vollendet haben. Mit der Registrierung bestätigt die Nutzerin oder der
          Nutzer, dass diese Voraussetzung erfüllt ist.
        </p>
        <p>
          Die Zugangsdaten sind geheim zu halten und dürfen nicht an Dritte
          weitergegeben werden. Mehrfachregistrierungen und automatisierte
          Anmeldungen sind ohne ausdrückliche Zustimmung des Anbieters
          unzulässig.
        </p>
      </LegalSection>

      <LegalSection heading="4. Preise und Zahlung">
        <p>
          Für die kostenpflichtigen Tarife gelten die jeweils im Bestellprozess
          angezeigten Preise. Soweit nicht anders angegeben, verstehen sich alle
          Preisangaben als Endpreise einschließlich der gesetzlichen
          Umsatzsteuer, sofern diese anfällt.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Plus: 2,99 EUR pro Monat oder 19,99 EUR pro Jahr.</li>
          <li>Pro: 5,99 EUR pro Monat oder 34,99 EUR pro Jahr.</li>
        </ul>
        <p>
          Die Abrechnung erfolgt über Stripe. Akzeptierte Zahlungsarten werden im
          Bestellprozess angezeigt. Das Entgelt wird zu Beginn des jeweiligen
          Abrechnungszeitraums fällig.
        </p>
        <p>
          Sofern ein Abonnement nicht rechtzeitig gekündigt wird, verlängert es
          sich automatisch um den jeweils gebuchten Abrechnungszeitraum
          (monatlich oder jährlich), sofern dem keine gesetzlichen Vorschriften
          entgegenstehen.
        </p>
        <p>
          Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zu
          kostenpflichtigen Funktionen vorübergehend zu sperren, bis offene
          Beträge ausgeglichen sind. Gesetzliche Rechte bleiben unberührt.
        </p>
      </LegalSection>

      <LegalSection heading="5. Laufzeit und Kündigung">
        <p>
          Die Laufzeit eines kostenpflichtigen Vertrags richtet sich nach dem
          jeweils gewählten Abrechnungszeitraum. Es gibt keine Mindestlaufzeit
          über den gebuchten Zeitraum hinaus.
        </p>
        <p>
          Nutzerinnen und Nutzer können ihr Abonnement jederzeit mit Wirkung zum
          Ende des laufenden Abrechnungszeitraums über das Nutzer-Dashboard
          kündigen. Die Kündigung wird mit Zugang der Erklärung beim Anbieter
          wirksam, sofern keine andere gesetzliche Regelung eingreift.
        </p>
        <p>
          Die technische Kündigungsmöglichkeit über die Website wird in
          Übereinstimmung mit den gesetzlichen Anforderungen bereitgestellt.
        </p>
        <p>
          Nach Beendigung des Vertrags bleibt der Zugriff auf kostenpflichtige
          Funktionen gesperrt. Bereits gespeicherte Inhalte können nach Maßgabe
          dieser Bedingungen und der Datenschutzerklärung noch für einen
          angemessenen Zeitraum gespeichert bleiben, soweit dies zur
          Vertragserfüllung, zur Abwicklung offener Vorgänge oder aufgrund
          gesetzlicher Pflichten erforderlich ist.
        </p>
      </LegalSection>

      <LegalSection heading="6. Widerrufsrecht für Verbraucher">
        <p>
          Verbraucherinnen und Verbraucher haben bei Fernabsatzverträgen
          grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen. Die
          Widerrufsfrist beginnt mit Vertragsschluss.
        </p>
        <p>
          Um das Widerrufsrecht auszuüben, muss der Anbieter mittels einer
          eindeutigen Erklärung über den Entschluss, diesen Vertrag zu
          widerrufen, informiert werden. Der Widerruf kann per E-Mail an
          support@typedhand.com oder über jedes andere eindeutige
          Kommunikationsmittel erklärt werden.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist genügt es, dass die Mitteilung über die
          Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist abgesendet
          wird.
        </p>
        <p>
          Wenn der Anbieter auf ausdrücklichen Wunsch der Verbraucherinnen und
          Verbraucher vor Ablauf der Widerrufsfrist mit der Ausführung der
          Dienstleistung beginnen soll, ist hierauf vor Vertragsschluss gesondert
          hinzuweisen. In diesem Fall können gesetzliche Folgen des vorzeitigen
          Leistungsbeginns eintreten, insbesondere kann das Widerrufsrecht bei
          vollständiger Vertragserfüllung unter den gesetzlichen Voraussetzungen
          erlöschen.
        </p>
        <p>Widerrufsfolgen:</p>
        <p>
          Wenn dieser Vertrag widerrufen wird, hat der Anbieter alle Zahlungen,
          die er von den Verbraucherinnen und Verbrauchern erhalten hat, ohne
          schuldhaftes Zögern und spätestens binnen 14 Tagen ab dem Tag
          zurückzuzahlen, an dem die Mitteilung über den Widerruf dieses Vertrags
          beim Anbieter eingegangen ist. Für die Rückzahlung wird dasselbe
          Zahlungsmittel verwendet, das bei der ursprünglichen Transaktion
          eingesetzt wurde, sofern nichts anderes ausdrücklich vereinbart wurde.
        </p>
        <p>
          Muster-Widerrufsformular:
        </p>
        <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm">
          An TypedHand, Constantin Persaud Einzelunternehmen, Lindenstraße 257,
          40235 Düsseldorf, Deutschland, E-Mail: support@typedhand.com
          {"\n\n"}
          Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die
          Nutzung von TypedHand.
          {"\n"}
          Bestellt am: __________
          {"\n"}
          Name der Verbraucher:in: __________
          {"\n"}
          Anschrift der Verbraucher:in: __________
          {"\n"}
          E-Mail-Adresse: __________
          {"\n"}
          Datum: __________
          {"\n"}
          Unterschrift (nur bei Mitteilung auf Papier): __________
        </p>
      </LegalSection>

      <LegalSection heading="7. Inhalte und Nutzungsrechte">
        <p>
          Die hochgeladenen Handschriften, Texte und die daraus erzeugten PDFs
          verbleiben grundsätzlich im Verantwortungsbereich der Nutzerinnen und
          Nutzer. Der Anbieter erhält ein einfaches, nicht ausschließliches,
          nicht übertragbares und auf die Vertragsdurchführung beschränktes
          Nutzungsrecht, soweit dies erforderlich ist, um die Inhalte zu
          speichern, zu verarbeiten, darzustellen, zu rendern, zu übertragen und
          die Funktionen von TypedHand bereitzustellen.
        </p>
        <p>
          Eine darüber hinausgehende Nutzung der Inhalte, insbesondere zu
          Trainings-, Analyse-, Marketing- oder sonstigen eigenen Zwecken, findet
          nicht statt. Der Anbieter greift nicht auf private Nutzerprofile zu,
          soweit dies nicht zur Supportbearbeitung, zur Störungsbehebung oder zur
          gesetzlichen Pflichterfüllung zwingend erforderlich ist.
        </p>
        <p>
          Die Nutzerinnen und Nutzer sichern zu, über die erforderlichen Rechte
          an den hochgeladenen Inhalten zu verfügen und keine Rechte Dritter zu
          verletzen.
        </p>
      </LegalSection>

      <LegalSection heading="8. Pflichten der Nutzer:innen">
        <p>
          Die Nutzerinnen und Nutzer verpflichten sich, TypedHand nur im Rahmen
          der geltenden Gesetze und dieser AGB zu verwenden.
        </p>
        <p>Unzulässig sind insbesondere:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>die Nutzung für rechtswidrige, beleidigende oder betrügerische Inhalte,</li>
          <li>die Verletzung von Urheber-, Marken-, Persönlichkeits- oder Datenschutzrechten Dritter,</li>
          <li>die missbräuchliche Umgehung von Tarifgrenzen, Wasserzeichen oder technischen Schutzmechanismen,</li>
          <li>die Weitergabe des eigenen Accounts oder von Zugangsdaten an Dritte,</li>
          <li>die Nutzung von Bots, Scraping oder sonstigen automatisierten Zugriffsformen ohne Zustimmung des Anbieters,</li>
          <li>die Verarbeitung von Inhalten, zu denen keine ausreichenden Nutzungsrechte bestehen.</li>
        </ul>
        <p>
          Bei Verstößen kann der Anbieter Inhalte sperren, Konten vorübergehend
          deaktivieren oder bei schwerwiegenden oder wiederholten Verstößen
          kündigen. Gesetzliche Ansprüche bleiben unberührt.
        </p>
      </LegalSection>

      <LegalSection heading="9. Haftung">
        <p>
          Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit
          sowie bei schuldhafter Verletzung von Leben, Körper oder Gesundheit.
        </p>
        <p>
          Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung
          wesentlicher Vertragspflichten. In diesem Fall ist die Haftung auf den
          vertragstypischen, vorhersehbaren Schaden begrenzt.
        </p>
        <p>
          Eine Haftung für Datenverluste wird nur im Rahmen der vorstehenden
          Regelungen übernommen. Die Nutzerinnen und Nutzer sind selbst dafür
          verantwortlich, eigene Daten und Inhalte zusätzlich zu sichern, soweit
          dies zumutbar ist.
        </p>
        <p>
          Die Haftung nach zwingenden gesetzlichen Vorschriften bleibt
          unberührt. Eine weitergehende Haftung ist ausgeschlossen, soweit
          gesetzlich zulässig.
        </p>
      </LegalSection>

      <LegalSection heading="10. Änderungen der AGB">
        <p>
          Der Anbieter kann diese AGB ändern, soweit hierfür ein sachlicher Grund
          besteht, etwa bei Änderungen der Rechtslage, technischen Änderungen,
          Erweiterungen des Leistungsumfangs oder zur Beseitigung von
          Regelungslücken.
        </p>
        <p>
          Wesentliche Änderungen werden den Nutzerinnen und Nutzern in Textform
          mitgeteilt. Soweit gesetzlich zulässig, gelten Änderungen als
          akzeptiert, wenn die Nutzerinnen und Nutzer nicht innerhalb einer
          angemessenen Frist widersprechen. Auf das Widerspruchsrecht und die
          Folgen eines unterlassenen Widerspruchs wird gesondert hingewiesen.
        </p>
        <p>
          Sofern eine Änderung die Hauptleistungspflichten betrifft oder die
          Fortsetzung des Vertrags unzumutbar macht, ist eine ausdrückliche
          Zustimmung erforderlich.
        </p>
      </LegalSection>

      <LegalSection heading="11. Anwendbares Recht, Gerichtsstand, Streitbeilegung">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
          UN-Kaufrechts. Zwingende Verbraucherschutzvorschriften des Staates, in
          dem die Nutzerin oder der Nutzer seinen gewöhnlichen Aufenthalt hat,
          bleiben unberührt.
        </p>
        <p>
          Ist die Nutzerin oder der Nutzer Kaufmann, juristische Person des
          öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist
          Gerichtsstand, soweit gesetzlich zulässig, Düsseldorf.
        </p>
        <p>
          Der Anbieter ist weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
        <p>
          Die frühere EU-Online-Streitbeilegungsplattform ist seit dem 20. Juli
          2025 geschlossen; ein Verweis auf diese Plattform wird daher nicht
          mehr aufgenommen.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
