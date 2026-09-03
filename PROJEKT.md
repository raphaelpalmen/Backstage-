# backstage.app — Projektstand

> Diese Datei zu Beginn einer neuen Sitzung hochladen, dann ist der Kontext sofort da.
> Zuletzt aktualisiert: 3. September 2026

---

## Was es ist

Crew-App für Event-Abende. Eine einzige HTML-Datei, kein Build-Schritt.
React 18 + Babel Standalone + Tailwind (alles per CDN), Firebase Realtime Database für Sync,
Leaflet für die Karte. Läuft auf GitHub Pages.

**Deploy:** Der Inhalt muss im Repo als `index.html` liegen — GitHub Pages liefert unter der
Hauptadresse nur diesen Dateinamen aus. `backstage.app.html` und `index.html` im Ordner sind identisch.

---

## Firebase

Projekt `unreal-546b4`, Region europe-west1. Config steht als `FB_CONF` oben in der Datei.

| Zweck | Pfad |
|---|---|
| Alle Eventdaten | `backstage/ops/events/{eventId}` |
| Benutzerkonten | `backstage/appUsers/{uid}` — **geteilt mit der alten App** |

Die Datenbankregeln verlangen `auth != null`. Deshalb muss echte Firebase-Anmeldung aktiv sein —
ohne sie kommt `permission_denied`.

### Datenmodell je Event

```
meta         name, date, city, days[], floors[],
             hotelName/hotelAddr/hotelLat/hotelLng,
             venueName/venueAddr/venueLat/venueLng,
             settleEmail, archived, createdAt
artists      {name, day, floor, setStart, setEnd, soundcheck,
              contactName, contactPhone, notes, rider, tech, riderDone{}}
pickups      {label, time, day, from, to, done, doneAt, doneBy}
travel       {dir:'in'|'out', day, artist, contact, phone, mode,
              from, to, time, driver, notes, done}
status       {artistId: {pickup_ok, im_club, rider_ok, soundcheck_ok,
              set_start, set_end, ausgecheckt}}
guestlist    {name, plus, note, checkedIn, inAt}
friendslist  {…wie guestlist, plus: pay:'bar'|'ec'|'free', qty, unitPrice, amount, blockId}
kasse
  blocks     {label, price, friendsPrice, startedAt, closedAt,
              counts:{ecNorm, barNorm}, editedAt}
  payouts    {label, amount, note, by, at}
  settlement {confirmedBy, confirmedAt, sentTo, ec, bar, total, out, cash, net, text}
contacts     {name, phone, title, note}   ← manuell ergänzte
drivers      {name, lat, lng, acc, active, updatedAt}
notes        {text}
```

---

## Rollen und Zugang

Anmeldung mit **E-Mail + Passwort** (echte Firebase-Konten).
Alte Rollen werden übersetzt: `admin`/`abendleitung`/`techniker` → Leitung, `kasse` → Einlass,
`artist` → kein Zugang.

**Drei Wege ins Team:**
1. Superadmin legt an (Team → „+ Person"). Läuft über eine **zweite Firebase-Instanz**
   (`account-worker`), damit der Admin nicht ausgeloggt wird. Firebase schickt automatisch
   eine Passwort-Mail; zusätzlich gibt es ein Startpasswort und einen WhatsApp-Teilen-Knopf.
2. Selbst registrieren mit Einladungscode: `LEITUNG`, `DOOR`, `FAHRER` — Code bestimmt nur die Rolle.
3. Ohne Code registrieren → Anfrage landet im Team, Superadmin gibt frei.

Wer mit Startpasswort kommt (`mustSetPassword: true`), muss beim ersten Öffnen ein
eigenes Passwort setzen.

**Event-Zuweisung:** pro Konto `allEvents: true` oder `events: {evId: true}`.
Superadmin sieht immer alles. Einstellbar beim Anlegen und jederzeit im Team.

### Sichtbare Tabs

| Rolle | Tabs |
|---|---|
| Leitung / Superadmin | Raster, Ablauf, Line-up, Pickups, An/Abreise, Einkauf, Karte, Gäste, Kasse, Auszahlung, Abrechnung, Kontakte, Notes, Event |
| Einlass | Gäste, Kasse, Auszahlung, Abrechnung, Raster |
| Fahrer | Fahrten, Raster, Kontakte |

Superadmin hat oben eine Leiste zum Springen zwischen Events / Leitung / Einlass / Fahrer / Verwalten / Team.

---

## Wichtige Funktionen

**Raster** — alle Floors als Spalten nebeneinander, Zeit senkrecht, rot leuchtender Jetzt-Strich quer.
**Ablauf** — alles chronologisch in einem Strang, mit Jetzt-Markierung.
**Einkauf** — summiert automatisch alle Rider-Positionen über alle Artists (73 Positionen beim
Dortmund-Event), gruppiert nach Alkohol / Getränke / Tabak / Essen / Material.
**Kontakte** — sammelt sich aus Artists, Reisen, Fahrern; Download als `.vcf`-Kontaktkarte.
**Kasse** — Klicker EC/Bar für die Abendkasse, Preisblöcke mit „Neuer Preis", nachträglich korrigierbar.
**Friendslist** — kein Klicker; beim Abhaken Bar/EC/frei wählen, Preis kommt aus dem laufenden Block.
**Abrechnung** — Abendkasse + Friendslist − Auszahlungen. Leitung bestätigt, Mailprogramm öffnet sich
mit fertigem Text (Empfänger unter EVENT → Abrechnung hinterlegen).

---

## Zeitlogik (wichtig)

Ein Veranstaltungstag läuft **10:00 bis 10:00 am Folgetag** (`NIGHT_END = 10`).
Set um 04:00 zählt also noch zur Vornacht. `isLiveDay()` vergleicht Tag **und** Monat —
über zehn Szenarien rund um Mitternacht getestet.

---

## Fallen, die schon zugeschnappt sind

**Niemals eine globale Variable `L` anlegen.** Das ist Leaflet. Der lokale Speicher hieß so und hat
die Kartenbibliothek überschrieben — Symptom: Karte meldet „nicht geladen", obwohl das Ladeprotokoll
`cdnjs ✓` zeigt. Heißt jetzt `STORE`.

**Leaflet-URLs auf cdnjs sind korrekt** (`leaflet.min.js`, `leaflet.min.css`, auch `leaflet.js`).
Alle drei geprüft. Der Fehler lag nie an der CDN.

**Hooks nie hinter einem `return`** — hat einmal einen Blackscreen verursacht.
Vor dem Ausliefern immer prüfen (siehe unten).

**Tailwind per CDN** unterstützt keine Deckkraft-Stufen wie `/8`, nur bis `/10`.

**Firebase kann keine freien Mails verschicken.** Passwort-Mails ja (`sendPasswordResetEmail`),
Abrechnung nur per `mailto:`, das der Nutzer selbst absendet.

**Zähler immer über `fbInc`** (Firebase-Transaktion), sonst überschreiben sich zwei Leute am Einlass.

---

## Offene Punkte

- **Spam:** Firebase-Mails landen im Spam. Abhilfe: Projekteinstellungen → „Öffentlich sichtbarer
  Name" auf `backstage.app`, und Authentifizierung → Vorlagen → „Domain anpassen" mit eigener
  Domain plus DNS-Einträgen. Noch nicht erledigt.
- **Koordinaten im bestehenden Dortmund-Event** stehen in Firebase noch falsch (ich hatte sie
  ursprünglich geschätzt). Einmal EVENT → Hotel und Venue öffnen und „Koordinaten aus Adresse
  holen" tippen. Im Seed sind sie bereits korrigiert.
- Artist-Ansicht und Chat wurden bewusst weggelassen.

---

## Vor jedem Ausliefern prüfen

```bash
# JSX extrahieren
python3 -c "
import re; s=open('index.html',encoding='utf-8').read()
open('app.jsx','w').write(re.search(r'<script type=\"text/babel\"[^>]*>(.*?)</script>',s,re.S).group(1))"

# Kompiliert es? Fehlt eine Komponente?
node -e "require('@babel/core').transformSync(require('fs').readFileSync('app.jsx','utf8'),
  {presets:[['@babel/preset-react']]}); console.log('ok')"

# Hooks-Regeln (fängt Blackscreens)
npx eslint@8.57.0 --no-eslintrc -c .eslintrc.json app.jsx
```

Zusätzlich: kein `const L=` in der Datei, und jeder Tab-`id` braucht einen `valid==='id'`-Zweig.

---

## Dateien im Ordner

| Datei | Zweck |
|---|---|
| `index.html` | **das ist die App** — so ins Repo laden |
| `backstage.app.html` | identische Kopie |
| `alte-backstage-app.html` | Vorgänger mit Artist-Ansicht und Chat |
| `unreal-ops.html` | erster Entwurf, überholt |
| `PROJEKT.md` | diese Datei |
