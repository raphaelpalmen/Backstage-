# backstage.app — technische Übersicht

Vorbereitung für das Gespräch mit der Firma und ihrem Intranet-Entwickler.
Ehrlich geschrieben, inklusive der Punkte, die ein IT-Mensch sofort finden wird.

---

## Was ist ein Intranet?

Ein internes Firmennetz mit Webseiten, die nur Mitarbeitende erreichen — nicht das offene
Internet. Typisch: Startseite mit News, Urlaubsanträge, Telefonliste, Dokumente, Schichtpläne.
Technisch ist es eine ganz normale Website, sie steht nur hinter der Firmenanmeldung.

Moderne Intranets (SharePoint, Confluence, Nextcloud oder Eigenbau) bestehen aus **Kacheln
oder Apps**. „Einbinden" heißt in der Regel eines von dreien:

1. **Verlinken** — eine Kachel, die backstage.app in einem neuen Tab öffnet.
2. **Einbetten** — die App läuft in einem Rahmen (iframe) mitten in der Intranet-Seite.
3. **Integrieren** — zusätzlich gemeinsame Anmeldung und Datenaustausch.

Alle drei sind möglich. Der Aufwand steigt von oben nach unten.

---

## Wie die App heute gebaut ist

**Eine einzige HTML-Datei**, rund 250 KB, ohne Build-Schritt. Sie enthält Oberfläche, Logik
und Daten-Anbindung. Nachgeladen werden zur Laufzeit React, Tailwind, Babel und Leaflet
von öffentlichen CDNs.

**Kein eigener Server.** Ausgeliefert wird sie als statische Datei über GitHub Pages.
Es gibt keinen Anwendungsserver, keine Datenbank in unserer Hand, nichts zu patchen.

**Firebase als Backend** (Google):
- *Realtime Database* für alle Daten, Standort Europa (europe-west1)
- *Authentication* für Anmeldung per E-Mail und Passwort
- Änderungen erscheinen bei allen Geräten sofort, ohne Aktualisieren

**Als App installierbar** (PWA): Manifest und Icons werden zur Laufzeit erzeugt, die Seite
lässt sich auf dem Homescreen ablegen und startet ohne Browserleiste.

**Datenmodell** liegt unter `backstage/ops/events/{eventId}` mit Artists, Pickups, Reisen,
Gäste- und Friendslist, Kasse, Auszahlungen, Abrechnungen, Kontakten und Fahrer-Standorten.
Benutzerkonten unter `backstage/appUsers`.

---

## Die Schwachstellen — bitte vorher wissen

Diese Punkte wird der Entwickler finden. Besser, du nennst sie selbst.

### 1. Rollenrechte — gelöst, muss aber eingespielt werden

Ursprünglich lagen die Rechte nur in der Oberfläche: Die Datenbank erlaubte jedem
Angemeldeten alles, und dass Einlass keine Abrechnung verschickt, war reine Frontend-Logik.

**Dafür liegt jetzt `firebase-rules.json` bereit** — Regeln, die jede Rolle serverseitig
prüfen. Einspielen in der Firebase-Konsole unter *Realtime Database → Regeln*.

Was die Regeln durchsetzen:

| Bereich | Wer darf schreiben |
|---|---|
| Eventdaten, Line-up, Reisen, Notizen | Leitung, Superadmin |
| Artist-Status, Rider abhaken | zusätzlich Artist Care |
| Pickup/Reise erledigt, Zeit anpassen | zusätzlich Fahrer |
| Gäste- und Friendslist, Kasse, Auszahlungen | Einlass, Leitung |
| Abrechnungen | nur Leitung und Superadmin, und nur neu anlegen — verschickte Fassungen lassen sich nicht nachträglich verändern |
| Eigener Standort | nur die Person selbst |
| Benutzerkonten und Rollen | nur Superadmin |

Lesen darf nur, wer eine Rolle hat, nicht auf Freigabe wartet **und** dem Event zugewiesen ist.

**Zwei Dinge ändern sich dadurch im Betrieb:**

Die Selbstregistrierung vergibt keine Rolle mehr. Der Einladungscode war für jeden im
Quelltext lesbar — er konnte nie ein echtes Recht sein. Wer sich registriert, landet jetzt
immer als Anfrage bei der Leitung; der Code sagt nur, welche Rolle gewünscht ist. Die App ist
entsprechend angepasst.

Bei einem **frischen Firebase-Projekt** muss der erste Superadmin von Hand in der Konsole
gesetzt werden (`backstage/appUsers/<uid>/roles/superadmin: true`), weil sich niemand mehr
selbst Rechte geben kann. Im bestehenden Projekt existiert er bereits.

### 2. Aufbau im Browser statt vorab

Babel übersetzt den Code bei jedem Laden im Browser, Tailwind erzeugt die Stile zur Laufzeit.
Das ist bequem für die Entwicklung, kostet aber ein bis zwei Sekunden beim Start und gilt
ausdrücklich nicht als Produktionsweise. Ein Build-Schritt würde die Datei auf einen Bruchteil
verkleinern und sofort starten lassen.

### 3. Datenschutz

Hier sitzt der eigentliche Gesprächsbedarf, sobald eine Firma das einsetzt:

- **Gästelisten** sind personenbezogene Daten. Namen, Begleitpersonen, Anwesenheitszeit.
- **Fahrer-Standorte** sind Ortungsdaten von Mitarbeitenden. In Deutschland
  mitbestimmungspflichtig — Betriebsrat und Einwilligung. Aktuell schaltet der Fahrer sie
  selbst ein und aus, was die Sache erleichtert, aber nicht erledigt.
- **Auftragsverarbeitungsvertrag mit Google** ist nötig, dazu ein Verzeichnis von
  Verarbeitungstätigkeiten und Löschfristen. Die Datenbank steht in Europa, das hilft.
- Ein **Löschkonzept** fehlt: Gästelisten bleiben derzeit unbegrenzt gespeichert.

### 4. Weiteres

Keine automatisierten Tests, keine Fehlerüberwachung, kein Änderungsprotokoll außer dem, was
wir bewusst speichern. Ein Entwickler, ich als Freelancer, kein Vertretungsfall geregelt.

---

## Was möglich ist

### Verlinken — sofort, kein Aufwand

Eine Kachel im Intranet, die die Adresse öffnet. Läuft heute schon.

### Einbetten per iframe — kleiner Aufwand

```html
<iframe src="https://…/backstage/"
        allow="geolocation; clipboard-write"
        style="width:100%;height:100%;border:0"></iframe>
```

Drei Dinge sind zu beachten:

- **`allow="geolocation"` ist Pflicht**, sonst funktioniert die Fahrerortung im Rahmen nicht.
- **Anmeldung im Rahmen** kann klemmen. Browser trennen Speicher von eingebetteten Seiten
  (Safari besonders streng), die Sitzung geht dann beim Neuladen verloren. Sauber gelöst,
  indem die App **von derselben Domain wie das Intranet** ausgeliefert wird.
- Die App ist für **Handybreite** gebaut. In einer breiten Intranet-Spalte sieht sie aus wie
  eine Handy-App in der Mitte. Am Eventabend nutzt sie ohnehin niemand am Rechner.

### Auf ihrem eigenen Server ausliefern — empfohlen

Die Datei auf den Intranet-Server legen, etwa unter `intranet.firma.de/backstage/`.
Damit entfallen alle Rahmen-Probleme, die Firma behält die Kontrolle über die Auslieferung,
und Aktualisierungen laufen über ihren normalen Weg. Es bleibt eine statische Datei — keine
Laufzeitumgebung, kein Wartungsaufwand auf dem Server.

### Gemeinsame Anmeldung (SSO) — der interessanteste Punkt

Wahrscheinlich fragt der Entwickler danach. Niemand will ein zusätzliches Passwort.

Hat die Firma Microsoft 365 oder Google Workspace, lässt sich das lösen: Firebase
Authentication unterstützt nach dem Upgrade auf **Identity Platform** die Anmeldung über
OIDC und SAML. Die Leute melden sich dann mit ihrem Firmenkonto an, Rollen können aus
Gruppen der Firma übernommen werden. Kostenpflichtig, aber Standardweg.

Ohne Upgrade bleibt es bei eigenen Konten in der App.

### Daten in andere Systeme

Firebase hat eine REST-Schnittstelle und ein Admin-SDK. Die Abrechnung eines Abends ließe
sich automatisch in die Buchhaltung übergeben, statt sie per Mail zu verschicken. Machbar,
aber neu zu bauen.

---

## Wenn die Firma es ernsthaft einsetzt

In dieser Reihenfolge:

1. **Eigenes Firebase-Projekt der Firma** — ihre Daten in ihrem Vertrag, nicht in meinem.
2. **Datenbankregeln einspielen** — `firebase-rules.json`, liegt fertig bereit.
3. **Datenschutz klären** — AV-Vertrag, Löschfristen, Betriebsrat wegen der Ortung.
4. **Build-Schritt** — schnelleres Laden, kleinere Datei.
5. **Auslieferung von ihrer Domain**, danach optional SSO.

Schritte 1 bis 3 würde ich als Bedingung für einen Firmeneinsatz nennen. 4 und 5 sind Komfort.

---

## Kurzfassung für das Gespräch

Die App ist eine statische Webseite mit Google Firebase als Datenbank. Kein Server, keine
Installation, läuft auf jedem Handy im Browser und lässt sich auf den Homescreen legen.

Einbinden ins Intranet geht als Kachel sofort, als eingebetteter Rahmen mit kleinem Aufwand,
und am saubersten, indem die Firma die Datei selbst ausliefert.

Die Zugriffsrechte werden serverseitig in der Datenbank durchgesetzt, nicht nur in der
Oberfläche — die Regeln liegen als Datei bei und sind eingespielt. Offen bleibt der
Datenschutz: Gästelisten sind personenbezogene Daten, die Fahrerortung ist
mitbestimmungspflichtig. Das gehört vor einem Firmeneinsatz geklärt.

Gemeinsame Anmeldung über das Firmenkonto ist möglich, wenn Firebase auf Identity Platform
gehoben wird.
