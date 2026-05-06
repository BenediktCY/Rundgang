const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, prepare } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/dist')));

initDb().then(() => {

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    res.json({ id: user.id, username: user.username, role: user.role, abteilung: user.abteilung });
  });

  app.get('/api/users', (req, res) => {
    res.json(prepare('SELECT id, username, role, abteilung FROM users ORDER BY username').all());
  });

  app.post('/api/users', (req, res) => {
    const { username, password, role, abteilung } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    if (prepare('SELECT id FROM users WHERE username = ?').get(username))
      return res.status(409).json({ error: 'Benutzername bereits vergeben' });
    const result = prepare('INSERT INTO users (username, password, role, abteilung) VALUES (?, ?, ?, ?)')
      .run(username, password, role || 'mitarbeiter', abteilung || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch('/api/users/:id', (req, res) => {
    const user = prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    if (req.body.username && req.body.username !== user.username) {
      const exists = prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(req.body.username, req.params.id);
      if (exists) return res.status(409).json({ error: 'Benutzername bereits vergeben' });
      prepare('UPDATE users SET username=? WHERE id=?').run(req.body.username, req.params.id);
    }
    const role = req.body.role ?? user.role;
    const abteilung = req.body.abteilung !== undefined ? req.body.abteilung : user.abteilung;
    prepare('UPDATE users SET role=?, abteilung=? WHERE id=?').run(role, abteilung, req.params.id);
    if (req.body.password) prepare('UPDATE users SET password=? WHERE id=?').run(req.body.password, req.params.id);
    res.json({ ok: true });
  });

  app.delete('/api/users/:id', (req, res) => {
    const user = prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    if (user.username === 'admin') return res.status(403).json({ error: 'Admin kann nicht gelöscht werden' });
    prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  app.get('/api/stammdaten/:typ', (req, res) => {
    res.json(prepare("SELECT id, wert FROM stammdaten WHERE typ = ? ORDER BY wert").all(req.params.typ));
  });

  app.post('/api/stammdaten/:typ', (req, res) => {
    const { wert } = req.body;
    if (!wert) return res.status(400).json({ error: 'Wert fehlt' });
    if (prepare("SELECT id FROM stammdaten WHERE typ=? AND wert=?").get(req.params.typ, wert))
      return res.status(409).json({ error: 'Eintrag existiert bereits' });
    const result = prepare("INSERT INTO stammdaten (typ, wert) VALUES (?, ?)").run(req.params.typ, wert);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/stammdaten/:id', (req, res) => {
    prepare('DELETE FROM stammdaten WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  app.get('/api/tickets', (req, res) => {
    res.json(prepare(`
      SELECT t.*, u1.username as erstellt_von_name, u2.username as zustaendig_name
      FROM tickets t
      LEFT JOIN users u1 ON t.erstellt_von = u1.id
      LEFT JOIN users u2 ON t.zustaendig = u2.id
      ORDER BY CASE t.dringlichkeit WHEN 'dringend' THEN 0 ELSE 1 END, t.erstellt_am DESC
    `).all());
  });

  app.get('/api/tickets/:id', (req, res) => {
    const ticket = prepare(`
      SELECT t.*, u1.username as erstellt_von_name, u2.username as zustaendig_name
      FROM tickets t
      LEFT JOIN users u1 ON t.erstellt_von = u1.id
      LEFT JOIN users u2 ON t.zustaendig = u2.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket nicht gefunden' });
    const kommentare = prepare(`
      SELECT k.*, u.username as autor_name FROM kommentare k
      JOIN users u ON k.autor_id = u.id
      WHERE k.ticket_id = ? ORDER BY k.erstellt_am ASC
    `).all(req.params.id);
    res.json({ ...ticket, kommentare });
  });

  app.post('/api/tickets', (req, res) => {
    const { titel, beschreibung, raum, abteilung, dringlichkeit, faellig, erstellt_von } = req.body;
    if (!titel || !beschreibung || !raum || !abteilung || !erstellt_von)
      return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    const pruefer = prepare("SELECT id FROM users WHERE role='pruefer' LIMIT 1").get();
    const result = prepare(`
      INSERT INTO tickets (titel, beschreibung, raum, abteilung, dringlichkeit, faellig, erstellt_von, zustaendig)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(titel, beschreibung, raum, abteilung, dringlichkeit || 'normal', faellig || null, erstellt_von, pruefer ? pruefer.id : null);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch('/api/tickets/:id', (req, res) => {
    const ticket = prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket nicht gefunden' });
    const requesterId = req.body.requester_id;
    const requester = prepare('SELECT * FROM users WHERE id = ?').get(requesterId);
    if (!requester) return res.status(403).json({ error: 'Nicht autorisiert' });
    if (requester.role !== 'pruefer' && ticket.erstellt_von !== requester.id)
      return res.status(403).json({ error: 'Keine Berechtigung' });
    const status = req.body.status ?? ticket.status;
    const faellig = req.body.faellig !== undefined ? req.body.faellig : ticket.faellig;
    const dringlichkeit = req.body.dringlichkeit ?? ticket.dringlichkeit;
    const titel = req.body.titel ?? ticket.titel;
    const beschreibung = req.body.beschreibung ?? ticket.beschreibung;
    const raum = req.body.raum ?? ticket.raum;
    const abteilung = req.body.abteilung ?? ticket.abteilung;
    prepare(`UPDATE tickets SET status=?, faellig=?, dringlichkeit=?, titel=?, beschreibung=?, raum=?, abteilung=?, aktualisiert_am=datetime('now') WHERE id=?`)
      .run(status, faellig, dringlichkeit, titel, beschreibung, raum, abteilung, req.params.id);
    res.json({ ok: true });
  });

  app.delete('/api/tickets/:id', (req, res) => {
    const ticket = prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket nicht gefunden' });
    const requesterId = req.body.requester_id;
    const requester = prepare('SELECT * FROM users WHERE id = ?').get(requesterId);
    if (!requester) return res.status(403).json({ error: 'Nicht autorisiert' });
    if (requester.role !== 'pruefer' && ticket.erstellt_von !== requester.id)
      return res.status(403).json({ error: 'Keine Berechtigung' });
    prepare('DELETE FROM kommentare WHERE ticket_id=?').run(req.params.id);
    prepare('DELETE FROM tickets WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/tickets/:id/kommentare', (req, res) => {
    const { autor_id, text, typ } = req.body;
    if (!autor_id || !text) return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    prepare(`INSERT INTO kommentare (ticket_id, autor_id, text, typ) VALUES (?, ?, ?, ?)`)
      .run(req.params.id, autor_id, text, typ || 'kommentar');
    prepare(`UPDATE tickets SET aktualisiert_am=datetime('now') WHERE id=?`).run(req.params.id);
    res.json({ ok: true });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Rundgang läuft auf http://localhost:${PORT}`));

}).catch(err => { console.error('Datenbankfehler:', err); process.exit(1); });
