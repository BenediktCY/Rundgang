# Rundgang Ticket-App

## Lokaler Start

### 1. Backend starten

```
cd backend
npm install
npm start
```

Läuft auf http://localhost:3001
Die Datenbank (rundgang.db) wird automatisch angelegt.

### 2. Frontend starten (neues Terminal-Fenster)

```
cd frontend
npm install
npm run dev
```

Öffne http://localhost:5173 im Browser.

---

## Standardnutzer

| Benutzername | Passwort | Rolle |
|---|---|---|
| admin | admin123 | Prüfer |
| max | max123 | Mitarbeiter |
| anna | anna123 | Mitarbeiter |

Passwörter können direkt in der Datenbank (rundgang.db) geändert werden.
Neue Nutzer können mit einem SQLite-Tool (z.B. DB Browser for SQLite) angelegt werden.

---

## Rollen

- **Mitarbeiter**: Tickets erstellen, Kommentare hinzufügen, Status auf "Zur Prüfung" setzen
- **Prüfer**: Alles wie Mitarbeiter + Tickets abschließen oder zurückweisen

---

## Migration auf Server

1. Den gesamten Ordner `rundgang-app` auf den Server kopieren
2. Dort dieselben Befehle ausführen wie lokal
3. Für Dauerbetrieb: `pm2 start backend/server.js` (pm2 einmalig installieren: `npm install -g pm2`)
4. Frontend für Produktion bauen: `cd frontend && npm run build`
   → erzeugt `frontend/dist/` → diese Dateien können vom Backend als statische Dateien ausgeliefert werden

---

## Räume und Abteilungen anpassen

In `frontend/src/components/TicketForm.jsx` ganz oben:
- `RAEUME` Array anpassen
- `ABTEILUNGEN` Array anpassen
"# Rundgang" 
