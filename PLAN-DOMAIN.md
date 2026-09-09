# Plan: eigene Domain, privater Code, abgesicherte Daten

Ausgangslage: Deploy über GitHub soll bleiben, Firebase bleibt für Anmeldung und Daten.
Du machst das übernächste Woche, vor dem Meeting, ohne Risiko.

**Leitgedanke:** Alles, was schiefgehen könnte, kommt ans Ende — und was nach dem Meeting
liegen kann, bleibt liegen. Vor dem Termin läuft die App, das ist wichtiger als perfekt.

---

## Der Name: backstageapp.de

Gewählt, verfügbar bei Strato. Kurz, merkbar, `.de` wirkt bei deutschen Kunden solide.
Verwechslung mit Spotifys `backstage.io` ist durch andere Endung und anderen Markt gering.

Beim Kauf bei Strato auf zwei Dinge achten:

- **Verlängerungspreis** prüfen, nicht nur das erste Jahr. Strato lockt oft mit einem Euro
  und ruft ab Jahr zwei deutlich mehr auf.
- **Nur die Domain buchen**, kein Hosting-Paket dazu. Ausgeliefert wird bei GitHub, von
  Strato brauchst du ausschließlich die Adresse und den DNS-Zugriff.

---

## Schritt 1 — Domain kaufen · 15 Min · kein Risiko

Kannst du sofort machen, auch aus dem Urlaub. Die Domain liegt erstmal ungenutzt herum und
berührt die laufende App nicht.

---

## Schritt 2 — GitHub Pro · 5 Min · geringes Risiko

**Reihenfolge ist wichtig:** erst Pro kaufen, dann Repository privat stellen. Andersherum
schaltet sich die Seite ab.

1. github.com → Settings → Billing → Plans → **Pro** (rund 4 $/Monat)
2. Repository `Backstage-` → Settings → General → ganz unten **Change visibility → Private**
3. **Prüfen:** deine bisherige Adresse im Browser öffnen, App muss normal laden

Geht etwas schief: Repository wieder auf Public stellen, dann läuft alles wie vorher.

---

## Schritt 3 — backstageapp.de auf GitHub Pages zeigen · 30 Min + bis zu 24 Std Wartezeit

**Bei Strato:** Kundenlogin → Domains → `backstageapp.de` → **DNS-Verwaltung**.
Dort die vorgegebenen Strato-Einträge ersetzen durch:

| Typ | Name | Ziel |
|---|---|---|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| CNAME | www | `raphaelpalmen.github.io` |

Falls Strato „@" nicht annimmt, ist das Feld für die Hauptdomain oft leer zu lassen.
Ein vorhandener A-Eintrag auf eine Strato-Adresse muss weg, sonst zeigt die Domain
auf deren Platzhalterseite.

**Dann bei GitHub:** Repository → Settings → Pages → **Custom domain** → `backstageapp.de`
→ Save. Warten, bis „DNS check successful" erscheint. Erst danach **Enforce HTTPS** anhaken —
der Haken lässt sich vorher nicht setzen, weil das Zertifikat noch fehlt.

Die alte `github.io`-Adresse leitet automatisch weiter, es geht nichts verloren.

**Wichtig direkt danach:** Firebase → Authentifizierung → Einstellungen → Autorisierte
Domains → `backstageapp.de` **hinzufügen**. Die bestehenden Einträge stehen lassen, sonst
brechen die Passwort-Mails.

Sag deinen Leuten Bescheid, dass sie die App neu auf den Homescreen legen — die alte Kachel
zeigt weiter auf die alte Adresse.

---

## Schritt 4 — Datenbankregeln einspielen · 10 Min · mittleres Risiko

Das ist der Schritt, der die Daten wirklich absichert. Datei `firebase-rules.json` liegt bereit.

1. Firebase-Konsole → Realtime Database → Reiter **Regeln**
2. Inhalt der Datei einfügen → **Veröffentlichen**
3. **Sofort testen**, in dieser Reihenfolge:
   - Mit deinem Superadmin anmelden → Events sichtbar?
   - Ein Event öffnen, eine Set-Zeit ändern → wird gespeichert?
   - Falls möglich mit einem Fahrer-Konto anmelden → sieht er seine Fahrten?

Geht etwas nicht: alte Regeln zurücksetzen (Firebase zeigt einen Verlauf) und mir sagen, was
genau fehlgeschlagen ist.

**Nicht am Tag vor dem Meeting machen.** Plan dafür einen Abend ein, an dem Zeit für einen
Rückzieher ist.

---

## Schritt 5 — Anmelde-Mails auf deine Domain · 30 Min + bis 24 Std · optional

Löst das Spam-Problem. Erst sinnvoll, wenn die Domain steht.

1. Firebase → Projekteinstellungen → **Öffentlich sichtbarer Name** auf deinen Produktnamen
2. Authentifizierung → Vorlagen → Stift → **Domain anpassen** → deine Domain
3. Die angezeigten TXT- und CNAME-Einträge beim Domain-Anbieter hinterlegen
4. Nach Bestätigung **Benutzerdefinierte Domain anwenden**

Nur ein `v=spf1`-Eintrag pro Domain — vorhandene zusammenführen, keinen zweiten anlegen.

---

## Schritt 6 — App Check · NACH dem Meeting

Das ist der echte Schutz davor, dass jemand mit einer Kopie deiner App auf eure Daten zugreift.
Braucht Änderungen im Code und eine reCAPTCHA-Einrichtung.

**Bewusst ans Ende gelegt:** Wird die Durchsetzung zu früh scharf geschaltet, sperrt sie im
Zweifel alle aus. Das will man nicht am Eventabend oder kurz vor einem Termin herausfinden.
Firebase erlaubt, App Check erst nur zu beobachten und später zu erzwingen — genau so machen
wir es, in Ruhe.

---

## Zeitplan

| Wann | Was | Risiko |
|---|---|---|
| jederzeit, auch aus dem Urlaub | Schritt 1 — Domain kaufen | keins |
| übernächste Woche, Abend 1 | Schritt 2 — Pro, Repo privat | gering |
| Abend 1 | Schritt 3 — Domain verbinden, dann warten | gering |
| Abend 2, mit Ruhe | Schritt 4 — Regeln einspielen und testen | mittel |
| wenn Zeit bleibt | Schritt 5 — Mail-Domain | keins |
| nach dem Meeting | Schritt 6 — App Check | mittel |

**Mindestens zwei Tage Abstand zum Meeting.** Falls etwas klemmt, ist Luft zum Beheben.

---

## Was du im Meeting sagen kannst

Eigene Domain, Quellcode nicht öffentlich, Rollen und Rechte serverseitig in der Datenbank
durchgesetzt, Abrechnungen unveränderlich protokolliert. App Check und das Löschkonzept sind
als nächste Schritte eingeplant — deshalb läuft der erste Einsatz als Pilot.

Das ist ein sauberer Stand für ein erstes Gespräch.
