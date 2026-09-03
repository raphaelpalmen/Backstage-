# Firebase-Mail anpassen — Vorlage zum Kopieren

> ⚠️ **Wenn die Konsole meldet: „Aktualisierungen von E-Mail-Vorlagen sind für dieses
> Projekt derzeit nicht verfügbar"** — dann ist Schritt 2 gesperrt. Schritt 1 funktioniert
> trotzdem und bringt den größten Teil. Details unten unter „Wenn die Vorlage gesperrt ist".

## 1. Absendername (wichtigster Schritt gegen Spam)

**Firebase-Konsole → Zahnrad → Projekteinstellungen → Allgemein**

| Feld | Wert |
|---|---|
| Öffentlich sichtbarer Name | `backstage.app` |
| Support-E-Mail | deine echte Adresse |

Dieser Name füllt `%APP_NAME%` und steht als Absender in jeder Mail.
Ohne gesetzte Support-Adresse wirken die Mails unseriöser.

---

## 2. Text der Mail

**Authentifizierung → Reiter „Vorlagen" → Passwort zurücksetzen → Stiftsymbol**

### Betreff

```
Dein Zugang zu backstage.app
```

### Nachricht

```
Hallo %FIRST_NAME%,

du wurdest für backstage.app freigeschaltet — unsere Crew-App für
Line-up, Pickups, Gästeliste und Abendkasse.

Leg hier dein Passwort fest, danach kannst du dich sofort anmelden:

%LINK%

Dein Login ist %EMAIL%.
Der Link gilt eine Stunde. Läuft er ab, meldet dich die Leitung einfach neu an.

Bis dahin,
das backstage-Team
```

### Kürzere Variante

```
Hallo %FIRST_NAME%,

dein Zugang zu backstage.app steht bereit. Passwort hier setzen:

%LINK%

Login: %EMAIL% · Link gilt eine Stunde.
```

---

## Verfügbare Platzhalter

| Platzhalter | Inhalt |
|---|---|
| `%APP_NAME%` | „Öffentlich sichtbarer Name" aus den Projekteinstellungen |
| `%LINK%` | Link zum Passwortsetzen — **muss drinbleiben** |
| `%EMAIL%` | E-Mail der Person |
| `%FIRST_NAME%` | Vorname — funktioniert, weil die App den Namen jetzt am Konto hinterlegt |

---

## 3. Spam dauerhaft loswerden (optional, braucht eigene Domain)

Im selben Bearbeiten-Dialog auf **„Domain anpassen"**:

1. Domain eintragen
2. Firebase zeigt TXT- und CNAME-Einträge → beim Domain-Anbieter hinterlegen
3. Bestätigung dauert bis zu 24 Stunden
4. Danach **„Benutzerdefinierte Domain anwenden"** klicken

Achtung: Pro Domain darf es nur **einen** `v=spf1`-Eintrag geben.
Vorhandene zusammenführen, nicht einen zweiten anlegen.

---

## Solange die Mails noch im Spam landen

In der Team-Verwaltung bei jeder Person **↗ teilen** — verschickt Link,
E-Mail und Startpasswort über WhatsApp, Signal oder SMS. Kein Spam-Filter dazwischen.

---

## Wenn die Vorlage gesperrt ist

Meldung: *„Aktualisierungen von E-Mail-Vorlagen sind für dieses Projekt derzeit nicht verfügbar."*

Das ist eine Sperre auf Google-Seite, kein Fehler im Projekt. Die Mails **werden weiterhin
verschickt** — nur der Wortlaut lässt sich nicht bearbeiten. Was dann bleibt:

**Funktioniert trotzdem — Schritt 1 oben.**
Der „Öffentlich sichtbare Name" liegt in den Projekteinstellungen, nicht in den Vorlagen,
und ist normalerweise nicht mitgesperrt. Er ersetzt `%APP_NAME%` **im Standardtext** und im
Absender. Aus „unreal-546b4" wird damit „backstage.app" — der auffälligste Teil ist also
auch ohne Vorlagenbearbeitung erledigt.

**Firebase-Support anschreiben.**
Der Link steckt direkt in der roten Meldung. Die Sperre wird auf Anfrage aufgehoben.

**Oder die Mail ganz umgehen — empfohlen für den Eventbetrieb.**
Die App braucht die Firebase-Mail nicht. Beim Anlegen einer Person entsteht ohnehin ein
Startpasswort; mit **↗ teilen** geht alles Nötige über WhatsApp oder SMS raus, und beim
ersten Öffnen setzt die Person ihr eigenes Passwort. Dieser Weg ist schneller, kommt
garantiert an und hängt an keiner Google-Freigabe.

**Eigener Mailserver (nur mit Identity Platform).**
Nach dem Upgrade auf Firebase Authentication with Identity Platform lässt sich ein eigener
SMTP-Server hinterlegen, womit Absender und Text vollständig dir gehören. Aufwendiger und
kostenpflichtig — für eine Crew-App meist übertrieben.
