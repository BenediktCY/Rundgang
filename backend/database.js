const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'rundgang.db');
let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'mitarbeiter',
      abteilung TEXT
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titel TEXT NOT NULL,
      beschreibung TEXT NOT NULL,
      raum TEXT NOT NULL,
      abteilung TEXT NOT NULL,
      dringlichkeit TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'offen',
      faellig TEXT,
      erstellt_von INTEGER NOT NULL,
      zustaendig INTEGER,
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
      aktualisiert_am TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (erstellt_von) REFERENCES users(id),
      FOREIGN KEY (zustaendig) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS kommentare (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      autor_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      typ TEXT NOT NULL DEFAULT 'kommentar',
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (autor_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS stammdaten (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      typ TEXT NOT NULL,
      wert TEXT NOT NULL
    );
  `);

  // Migration: name-Spalte entfernen falls vorhanden (ignorieren wenn nicht da)
  try { db.run("ALTER TABLE users ADD COLUMN abteilung TEXT"); } catch(e) {}

  const userCount = db.exec('SELECT COUNT(*) FROM users')[0];
  if (!userCount || userCount.values[0][0] === 0) {
    db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'pruefer')");
    db.run("INSERT INTO users (username, password, role) VALUES ('max', 'max123', 'mitarbeiter')");
    console.log('Standardnutzer angelegt');
  }

  const stammdatenCount = db.exec('SELECT COUNT(*) FROM stammdaten')[0];
  if (!stammdatenCount || stammdatenCount.values[0][0] === 0) {
    const raeume = ['Produktion A','Produktion B','Lager','Verpackung','Labor','Umkleide','Flur EG','Flur OG','Außenbereich','Sonstiges'];
    const abteilungen = ['Produktion','Qualitätssicherung','Lager/Logistik','Labor','Technik/Wartung','Verwaltung','Sonstiges'];
    raeume.forEach(r => db.run("INSERT INTO stammdaten (typ, wert) VALUES ('raum', ?)", [r]));
    abteilungen.forEach(a => db.run("INSERT INTO stammdaten (typ, wert) VALUES ('abteilung', ?)", [a]));
  }

  save();
  return db;
}

function save() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function prepare(sql) {
  return {
    get: (...params) => {
      const flat = params.flat();
      const result = db.exec(sql, flat.length ? flat : undefined);
      if (!result[0]) return undefined;
      const row = result[0].values[0];
      if (!row) return undefined;
      return Object.fromEntries(result[0].columns.map((c, i) => [c, row[i]]));
    },
    all: (...params) => {
      const flat = params.flat();
      const result = db.exec(sql, flat.length ? flat : undefined);
      if (!result[0]) return [];
      return result[0].values.map(row => Object.fromEntries(result[0].columns.map((c, i) => [c, row[i]])));
    },
    run: (...params) => {
      const flat = params.flat();
      db.run(sql, flat.length ? flat : undefined);
      save();
      const lastId = db.exec('SELECT last_insert_rowid()')[0];
      return { lastInsertRowid: lastId ? lastId.values[0][0] : null };
    }
  };
}

module.exports = { initDb, prepare };
