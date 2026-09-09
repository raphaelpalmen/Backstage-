# backstage.app als Dienst anbieten — was dafür nötig wäre

Ausgangslage: Du willst den Code **nicht abgeben**, sondern Kunden einen Zugang einrichten,
den sie nutzen. Damit wirst du vom Freelancer zum Anbieter — technisch und rechtlich zwei
verschiedene Paar Schuhe.

> Ich bin kein Anwalt. Die Datenschutz-Punkte sind der Stand dessen, was üblicherweise
> verlangt wird — die Verträge selbst gehören einmal von einer Fachanwältin für IT-Recht
> geprüft. Das ist überschaubares Geld gegen ein sehr unangenehmes Risiko.

---

## Zuerst: Ist dein Code gerade öffentlich?

GitHub Pages läuft bei kostenlosen Konten **nur mit öffentlichen Repositories**. Falls du kein
GitHub Pro hast, kann jeder deinen kompletten Quelltext lesen, kopieren und selbst betreiben.

Prüfen: github.com/raphaelpalmen/Backstage- → steht neben dem Namen „Public" oder „Private"?

Steht dort Public und du willst das nicht, sind das deine Möglichkeiten:

- **GitHub Pro** (rund 4 $/Monat) erlaubt Pages aus privaten Repos.
- **Woanders hosten** — Firebase Hosting, Netlify oder Vercel liefern aus privaten Repos aus,
  in der Einstiegsstufe kostenlos.

Wichtig zur Einordnung: Die Firebase-Zugangsdaten im Code sind **kein Geheimnis**, das ist bei
Firebase so vorgesehen — geschützt wird über die Regeln, nicht über die Schlüssel. Es geht
allein um deinen Quelltext.

---

## Die unbequeme Wahrheit zum Codeschutz

Eine Web-App läuft im Browser des Kunden. Alles, was dort läuft, kann er lesen. Ein Build-Schritt
mit Minifizierung macht den Code unleserlich genug, dass niemand ihn nebenbei weiterentwickelt —
aber technisch verhindern kannst du das Kopieren nicht.

**Der Schutz liegt im Vertrag, nicht im Code.** Nutzungsvertrag mit klarer Lizenz: Nutzung ja,
Weitergabe und Nachbau nein. Dazu die Dinge, die man nicht mitkopieren kann — dein Betrieb,
deine Weiterentwicklung, dein Support, deine Kenntnis des Eventgeschäfts.

Wer wirklich schützen will, verlagert Logik auf einen eigenen Server. Bei dieser App gäbe es
dafür wenig zu verlagern; der Wert steckt im Zuschnitt auf euren Ablauf, nicht in Algorithmen.

---

## Technisch: vom Bastelstand zum Produkt

### 1. Mandantenfähigkeit

Heute: ein Firebase-Projekt, ein Datenbaum. Für Kunden zwei Wege:

**Ein Projekt pro Kunde** — sauberste Trennung, eigene Datenbank, eigener Vertrag mit Google
möglich, Kunde könnte es notfalls übernehmen. Nachteil: Einrichtung und Pflege pro Kunde.

**Ein Projekt, getrennte Mandanten** — Daten unter `tenants/{kundeId}/…`, Regeln prüfen die
Zugehörigkeit. Weniger Verwaltung, aber ein Fehler in den Regeln betrifft alle Kunden.
Firebase Identity Platform bietet dafür echte Mandantenfähigkeit.

Für die ersten zwei, drei Kunden: **ein Projekt pro Kunde.** Einfacher zu verstehen, einfacher
zu erklären, und du kannst jederzeit auf Mandanten umstellen.

### 2. Sicherheit nachziehen

- **Datenbankregeln** — liegen als `firebase-rules.json` bereit, gehören eingespielt.
- **Eventzuweisung hart machen** — heute Sache der Oberfläche. Für getrennte Kunden Pflicht.
- **App Check** aktivieren — verhindert, dass jemand mit deinen Firebase-Daten außerhalb deiner
  App auf die Datenbank zugreift. Ein Schalter in der Konsole plus wenige Zeilen Code.
- **Zwei-Faktor für Administratoren** — über Identity Platform möglich.
- **Änderungsprotokoll** — wer hat wann was geändert. Bei Umsatzzahlen praktisch Pflicht.
- **Sicherungen** — Firebase sichert automatisch, aber ein eigener Export je Kunde und ein
  einmal getesteter Wiederherstellungsversuch gehören dazu.

### 3. Handwerkliche Reife

- **Build-Schritt** — Code vorab übersetzen statt im Browser. Schnellerer Start, kleinere Datei,
  gleichzeitig der erwähnte Kopierschutz light.
- **Testumgebung** neben der Produktivumgebung, damit du nicht am laufenden Event änderst.
- **Fehlerüberwachung** (etwa Sentry) — du erfährst von Abstürzen, bevor der Kunde anruft.
- **Automatisierte Tests** für das Rechnen: Abrechnung, Preisblöcke, Zeitlogik.
- **Versionsnummer in der App**, damit bei Rückfragen klar ist, welcher Stand läuft.

---

## Datenschutz: was wirklich verlangt wird

Sobald du für einen Kunden Daten verarbeitest, bist du **Auftragsverarbeiter**. Das bringt
konkrete Pflichten mit sich.

### Verträge

- **Auftragsverarbeitungsvertrag (AVV)** — den stellst **du** dem Kunden, nicht umgekehrt.
  Regelt Weisungsgebundenheit, Vertraulichkeit, Unterauftragnehmer, Löschung bei Vertragsende.
- **AVV mit Google** für Firebase — Google stellt einen bereit, du musst ihn abschließen und
  Google als Unterauftragnehmer im eigenen AVV benennen.
- **Drittlandtransfer** — Google ist US-Konzern. Standardvertragsklauseln beziehungsweise
  Data Privacy Framework dokumentieren. Dass die Datenbank in Europa steht, hilft, erledigt
  es aber nicht.

### Dokumente

- **Verzeichnis von Verarbeitungstätigkeiten** — auch Auftragsverarbeiter brauchen eines.
- **TOM** (technische und organisatorische Maßnahmen) — beschreibt Verschlüsselung,
  Zugriffskonzept, Rollen, Sicherungen. Der Kunde wird danach fragen.
- **Löschkonzept** — heute bleiben Gästelisten unbegrenzt liegen. Sinnvoll: personenbezogene
  Daten automatisch nach 30 bis 90 Tagen nach dem Event löschen. Das ist Programmierarbeit
  und gleichzeitig ein Verkaufsargument.
- **Datenschutzerklärung** für die App selbst.
- **Meldeweg bei Datenpannen** — 72 Stunden, du musst den Kunden unverzüglich informieren.

### Besonders heikel: Standortdaten

Die Fahrerortung ist Verarbeitung von Beschäftigtendaten und damit in Deutschland
mitbestimmungspflichtig. Der Kunde braucht eine Betriebsvereinbarung oder eine belastbare
Einwilligung — das ist seine Pflicht, aber du solltest technisch das Richtige liefern:

Gut gelöst ist schon: Der Fahrer schaltet selbst ein und aus, es läuft nur bei geöffneter App,
Pausen sind sichtbar markiert.

Fehlt noch: **automatisches Löschen der Standortverläufe** nach dem Event, und dass gar nicht
erst eine Historie entsteht, sondern nur die letzte Position.

### Betroffenenrechte

Auskunft, Berichtigung, Löschung, Datenübertragbarkeit — dafür brauchst du einen Ablauf. Eine
Exportfunktion je Person und ein „Person vollständig löschen" in der Verwaltung wären dafür
das technische Rückgrat.

---

## Geschäftlich

- **Rechtsform** — als Einzelunternehmer haftest du mit dem Privatvermögen. Bei Umsatzdaten
  und Beschäftigtendaten mehrerer Firmen ist eine UG oder GmbH überlegenswert.
- **Vermögensschadenhaftpflicht** für IT-Dienstleister. Nicht teuer, deckt genau den Fall
  „Daten weg" oder „Abrechnung falsch".
- **Verfügbarkeit** — versprich nichts, was du nicht halten kannst. „Wir bemühen uns" statt
  99,9 Prozent. Und sag ehrlich, dass du ein Mensch bist und kein Rechenzentrum.
- **Vertretung** — was passiert, wenn du im Urlaub bist und es am Eventabend klemmt? Zumindest
  eine Person, die den Zugang hat und Firebase zurücksetzen kann.
- **Preismodell** — Einrichtung plus Jahreslizenz je Firma oder je Event ist bei
  Veranstaltungssoftware üblich.

---

## In welcher Reihenfolge

**Für einen ersten Pilotkunden**, ausdrücklich als Test deklariert:

1. Repository privat stellen oder woanders hosten
2. Datenbankregeln einspielen
3. Eigenes Firebase-Projekt für den Kunden
4. App Check aktivieren
5. Einfacher AVV und eine kurze TOM-Beschreibung
6. Schriftlich festhalten: Pilotphase, keine Verfügbarkeitszusage, Datenschutz gemeinsam
   in Arbeit

Das ist an einem Wochenende zu schaffen und reicht für einen wohlwollenden Kunden, der weiß,
worauf er sich einlässt.

**Bevor du Geld dafür nimmst und es ernsthaft ausrollst:**

7. Löschkonzept umsetzen — automatisch, nicht von Hand
8. Eventzuweisung hart machen
9. Änderungsprotokoll
10. Build-Schritt, Testumgebung, Fehlerüberwachung
11. AVV anwaltlich prüfen lassen, Verarbeitungsverzeichnis, Datenschutzerklärung
12. Haftpflicht und Rechtsform klären
13. Sicherung und Wiederherstellung einmal wirklich durchspielen

---

## Was du im Gespräch sagen kannst

Dass die App als Dienst angeboten wird und nicht als Datei übergeben — jeder Kunde bekommt eine
eigene Umgebung mit eigenen Daten. Dass Rollen und Rechte serverseitig durchgesetzt sind und
Abrechnungen unveränderlich protokolliert werden. Und dass Datenschutz und Löschkonzept gerade
aufgebaut werden, weshalb der erste Einsatz als Pilot läuft.

Das ist ehrlich, realistisch und klingt nach jemandem, der weiß, was er tut. Genau das willst du
in dem Raum sein.
