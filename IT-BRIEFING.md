# backstage.app — technische Übersicht

Stand: September 2026 · Vorbereitung für das Gespräch mit der Firma und ihrem Intranet-Entwickler.
Ehrlich geschrieben, inklusive der Punkte, die ein IT-Mensch von selbst findet.

---

## Was ist ein Intranet?

Ein internes Firmennetz mit Webseiten, die nur Mitarbeitende erreichen — nicht das offene
Internet. Typisch: Startseite mit News, Urlaubsanträge, Telefonliste, Dokumente, Schichtpläne.
Technisch eine ganz normale Website, sie steht nur hinter der Firmenanmeldung.

Moderne Intranets (SharePoint, Confluence, Nextcloud oder Eigenbau) bestehen aus Kacheln oder
Apps. „Einbinden" heißt in der Regel eines von dreien:

1. **Verlinken** — eine Kachel öffnet backstage.app in einem neuen Tab.
2. **Einbetten** — die App läuft in einem Rahmen mitten in der Intranet-Seite.
3. **Integrieren** — zusätzlich gemeinsame Anmeldung und Datenaustausch.

Alle drei sind möglich, der Aufwand steigt von oben nach unten.

---

## Aufbau

**Eine einzige HTML-Datei**, rund 250 KB, ohne Build-Schritt. Sie enthält Oberfläche, Logik und
Datenanbindung. Zur Laufzeit werden React, Tailwind, Babel und Leaflet von öffentlichen CDNs
nachgeladen.

**Kein eigener Server.** Ausgeliefert als statische Datei über GitHub Pages. Kein
Anwendungsserver, keine eigene Datenbank, nichts zu patchen.

**Firebase als Backend** (Google):

- *Realtime Database*, Standort Europa (europe-west1) — alle Daten
- *Authentication* — Anmeldung mit E-Mail und Passwort
- Änderungen erscheinen auf allen Geräten sofort, ohne Aktualisieren

**Installierbar als App** (PWA): Manifest und Icons entstehen zur Laufzeit, die Seite lässt sich
auf den Homescreen legen und startet ohne Browserleiste.

**Datenpfade**

| Zweck | Pfad |
|---|---|
| Eventdaten | `backstage/ops/events/{eventId}` |
| Benutzerkonten | `backstage/appUsers/{uid}` |

Je Event: Line-up mit Rider und Techrider, Pickups, An- und Abreisen, Statusmarken, Gäste- und
Friendslist, Abendkasse mit Preisblöcken, Auszahlungen, Abrechnungen, Kontakte, Fahrerstandorte,
Notizen.

---

## Rollen und Rechte

Fünf Rollen: **Superadmin, Leitung, Artist Care, Einlass, Fahrer.** Eine Person kann mehrere
gleichzeitig haben — Artist Care plus Fahrer etwa sieht beide Bereiche in einer Oberfläche.

Die Rechte werden **serverseitig in der Datenbank** durchgesetzt, nicht nur in der Oberfläche.
Die Regeln liegen als `firebase-rules.json` im Repo und gehören in der Firebase-Konsole unter
*Realtime Database → Regeln* eingespielt.

| Bereich | Wer darf schreiben |
|---|---|
| Eventdaten, Line-up, Reisen, Notizen, Kontakte | Leitung, Superadmin |
| Artist-Status, Rider abhaken | zusätzlich Artist Care |
| Pickup/Reise erledigt, Zeit anpassen | zusätzlich Fahrer |
| Gäste- und Friendslist, Kasse, Auszahlungen | Einlass, Leitung |
| Abrechnungen | nur Leitung und Superadmin — **nur anlegen, nie ändern** |
| Eigener Standort | nur die Person selbst |
| Benutzerkonten und Rollenvergabe | nur Superadmin |

Lesen darf nur, wer eine Rolle hat und nicht auf Freigabe wartet.

**Zwei Eigenschaften, die sich daraus ergeben:**

*Selbstregistrierung vergibt keine Rolle.* Der Einladungscode stand im Quelltext und war für
jeden lesbar — er konnte nie ein echtes Recht sein. Wer sich registriert, landet als Anfrage
beim Superadmin; der Code sagt nur, welche Rolle gewünscht ist.

*Verschickte Abrechnungen sind unveränderlich.* Jeder Versand wird als eigener Datensatz
abgelegt. Ändert sich danach etwas, warnt die App und verschickt eine korrigierte Fassung mit
Auflistung der Abweichungen. Der Verlauf bleibt vollständig nachvollziehbar.

---

## Was noch offen ist

### Eventzuweisung ist keine harte Sperre

Personen lassen sich einzelnen Events zuweisen und sehen dann nur diese. Das ist eine Sache der
Oberfläche. Firebase erlaubt Lesen immer für den ganzen abgefragten Ast, und die App lädt die
Eventliste am Stück — wer eine Rolle hat, könnte technisch alle Events lesen. **Schreiben bleibt
streng nach Rolle.**

Hart machen ließe sich das mit einem schlanken Index, aus dem jeder nur Titel und Datum liest,
während die Eventdaten einzeln und geprüft geladen werden. Überschaubarer Umbau, lohnt sich,
sobald mehrere Kunden oder Abteilungen dieselbe Datenbank teilen.

### Aufbau im Browser statt vorab

Babel übersetzt den Code bei jedem Laden im Browser, Tailwind erzeugt die Stile zur Laufzeit.
Bequem in der Entwicklung, kostet ein bis zwei Sekunden beim Start und gilt ausdrücklich nicht
als Produktionsweise. Ein Build-Schritt würde die Datei stark verkleinern und sofort starten
lassen.

### Datenschutz

Der eigentliche Gesprächsbedarf, sobald eine Firma das einsetzt:

- **Gästelisten** sind personenbezogene Daten: Namen, Begleitpersonen, Anwesenheitszeit.
- **Fahrerstandorte** sind Ortungsdaten von Mitarbeitenden — in Deutschland
  mitbestimmungspflichtig, also Betriebsrat und Einwilligung. Entlastend: Der Fahrer schaltet
  sie selbst ein und aus, sie läuft nur bei geöffneter App, und nach zwei Minuten ohne
  Aktualisierung wird sie sichtbar als pausiert markiert.
- **Auftragsverarbeitungsvertrag mit Google** nötig, dazu Verarbeitungsverzeichnis und
  Löschfristen. Dass die Datenbank in Europa steht, hilft.
- Ein **Löschkonzept** fehlt: Gästelisten bleiben derzeit unbegrenzt gespeichert.

### Betrieb

Keine automatisierten Tests, keine Fehlerüberwachung im Betrieb, ein Entwickler, kein
Vertretungsfall geregelt. Vor jeder Auslieferung laufen Prüfungen auf Übersetzbarkeit,
React-Regeln und Vollständigkeit der Ansichten.

---

## Einbindung ins Intranet

### Verlinken — sofort

Eine Kachel mit der Adresse. Funktioniert heute.

### Einbetten per iframe — kleiner Aufwand

```html
<iframe src="https://…/backstage/"
        allow="geolocation; clipboard-write"
        style="width:100%;height:100%;border:0"></iframe>
```

Drei Punkte:

- **`allow="geolocation"` ist Pflicht**, sonst funktioniert die Fahrerortung im Rahmen nicht.
- **Anmeldung im Rahmen** kann klemmen. Browser trennen den Speicher eingebetteter Seiten
  (Safari besonders streng), die Sitzung geht dann beim Neuladen verloren. Sauber gelöst, indem
  die App von derselben Domain wie das Intranet ausgeliefert wird.
- Die App ist für **Handybreite** gebaut. In einer breiten Spalte steht sie mittig wie eine
  Handy-App. Am Eventabend nutzt sie ohnehin niemand am Rechner.

### Von der eigenen Domain ausliefern — empfohlen

Die Datei auf den Intranet-Server legen, etwa `intranet.firma.de/backstage/`. Damit entfallen
alle Rahmen-Probleme, die Firma behält die Kontrolle über die Auslieferung, Aktualisierungen
laufen über ihren normalen Weg. Es bleibt eine statische Datei — keine Laufzeitumgebung, kein
Wartungsaufwand auf dem Server.

### Gemeinsame Anmeldung (SSO)

Wahrscheinlich die erste Frage des Entwicklers. Niemand will ein zusätzliches Passwort.

Hat die Firma Microsoft 365 oder Google Workspace, ist das lösbar: Firebase Authentication
unterstützt nach dem Upgrade auf **Identity Platform** Anmeldung über OIDC und SAML. Die Leute
melden sich mit dem Firmenkonto an, Rollen lassen sich aus Firmengruppen ableiten.
Kostenpflichtig, aber Standardweg. Ohne Upgrade bleibt es bei eigenen Konten in der App.

### Daten in andere Systeme

Firebase bietet eine REST-Schnittstelle und ein Admin-SDK. Die Abrechnung eines Abends ließe
sich automatisch an die Buchhaltung übergeben, statt sie per Mail zu verschicken. Machbar, aber
neu zu bauen.

---

## Wenn die Firma es ernsthaft einsetzt

In dieser Reihenfolge:

1. **Eigenes Firebase-Projekt der Firma** — ihre Daten in ihrem Vertrag, nicht in meinem.
   Beim Aufsetzen den ersten Superadmin von Hand in der Konsole eintragen
   (`backstage/appUsers/<uid>/roles/superadmin: true`), da sich niemand selbst Rechte gibt.
2. **Regeln einspielen** — `firebase-rules.json`, liegt fertig bereit.
3. **Datenschutz klären** — AV-Vertrag, Löschfristen, Betriebsrat wegen der Ortung.
4. **Build-Schritt** — schnelleres Laden, kleinere Datei.
5. **Auslieferung von ihrer Domain**, danach optional SSO.
6. Bei mehreren Kunden in einer Datenbank: **Eventzuweisung hart machen** (siehe oben).

Punkte 1 bis 3 würde ich als Bedingung für einen Firmeneinsatz nennen, 4 bis 6 sind Ausbau.

---

## Kurzfassung fürs Gespräch

Die App ist eine statische Webseite mit Google Firebase als Datenbank. Kein Server, keine
Installation, läuft auf jedem Handy im Browser und lässt sich auf den Homescreen legen.

Fünf Rollen, Mehrfachrollen möglich, die Rechte sind serverseitig in der Datenbank durchgesetzt
und nicht nur in der Oberfläche. Abrechnungen sind unveränderlich und lückenlos nachvollziehbar.

Einbinden ins Intranet geht als Kachel sofort, als Rahmen mit kleinem Aufwand, am saubersten
indem die Firma die Datei selbst ausliefert. Anmeldung über das Firmenkonto ist möglich, wenn
Firebase auf Identity Platform gehoben wird.

Offen sind zwei Dinge, beide bekannt: Der Datenschutz für Gästelisten und Fahrerortung gehört
geregelt, und die Zuweisung einzelner Events an Personen ist bisher eine Sache der Oberfläche,
keine harte Sperre.
