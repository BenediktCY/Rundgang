import React, { useState } from 'react';
import { updateUser } from '../api';

export default function Profil({ user, onBack, onUserUpdate }) {
  const [pwForm, setPwForm] = useState({ alt: '', neu: '', neu2: '' });
  const [usernameForm, setUsernameForm] = useState({ username: user.username });
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [unError, setUnError] = useState('');
  const [unOk, setUnOk] = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePwChange(e) {
    e.preventDefault(); setPwError(''); setPwOk('');
    if (!pwForm.alt || !pwForm.neu || !pwForm.neu2) { setPwError('Alle Felder ausfüllen'); return; }
    if (pwForm.neu !== pwForm.neu2) { setPwError('Neues Passwort stimmt nicht überein'); return; }
    if (pwForm.neu.length < 4) { setPwError('Mindestens 4 Zeichen'); return; }
    setSaving(true);
    try {
      const check = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: pwForm.alt })
      });
      if (!check.ok) { setPwError('Altes Passwort falsch'); setSaving(false); return; }
      await updateUser(user.id, { password: pwForm.neu });
      setPwForm({ alt: '', neu: '', neu2: '' });
      setPwOk('Passwort geändert');
    } catch { setPwError('Fehler beim Ändern'); }
    finally { setSaving(false); }
  }

  async function handleUsernameChange(e) {
    e.preventDefault(); setUnError(''); setUnOk('');
    if (!usernameForm.username.trim()) { setUnError('Benutzername darf nicht leer sein'); return; }
    if (usernameForm.username === user.username) { setUnError('Kein neuer Benutzername eingegeben'); return; }
    setSaving(true);
    try {
      await updateUser(user.id, { username: usernameForm.username.trim().toLowerCase() });
      const updated = { ...user, username: usernameForm.username.trim().toLowerCase() };
      onUserUpdate(updated);
      setUnOk('Benutzername geändert');
    } catch(err) { setUnError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Zurück</button>
        <h2 style={s.title}>Mein Profil</h2>
      </div>

      <div style={s.info}>
        <p style={s.infoName}>@{user.username}</p>
        <p style={s.infoMeta}>{user.abteilung || 'keine Abteilung'} · {user.role === 'pruefer' ? 'Prüfer' : 'Mitarbeiter'}</p>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Benutzername ändern</h3>
        <form onSubmit={handleUsernameChange} style={s.form}>
          <Field label="Neuer Benutzername">
            <input style={s.input} value={usernameForm.username} onChange={e => setUsernameForm({ username: e.target.value })} autoCapitalize="none" />
          </Field>
          {unError && <p style={s.error}>{unError}</p>}
          {unOk && <p style={s.ok}>{unOk}</p>}
          <button style={s.btn} type="submit" disabled={saving}>Ändern</button>
        </form>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Passwort ändern</h3>
        <form onSubmit={handlePwChange} style={s.form}>
          <Field label="Aktuelles Passwort">
            <input style={s.input} type="password" value={pwForm.alt} onChange={e => setPwForm(f => ({ ...f, alt: e.target.value }))} />
          </Field>
          <Field label="Neues Passwort">
            <input style={s.input} type="password" value={pwForm.neu} onChange={e => setPwForm(f => ({ ...f, neu: e.target.value }))} />
          </Field>
          <Field label="Wiederholen">
            <input style={s.input} type="password" value={pwForm.neu2} onChange={e => setPwForm(f => ({ ...f, neu2: e.target.value }))} />
          </Field>
          {pwError && <p style={s.error}>{pwError}</p>}
          {pwOk && <p style={s.ok}>{pwOk}</p>}
          <button style={s.btn} type="submit" disabled={saving}>Passwort ändern</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  container: { padding: '1rem', maxWidth: 480, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 14, padding: 0, fontFamily: "'IBM Plex Sans', sans-serif" },
  title: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 500, margin: 0, color: '#1a1a18' },
  info: { background: '#f0f0ec', borderRadius: 10, padding: '14px 16px', marginBottom: '1.5rem' },
  infoName: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, margin: '0 0 4px 0', color: '#1a1a18' },
  infoMeta: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: '#666', margin: 0 },
  card: { background: '#fff', border: '1px solid #e8e8e3', borderRadius: 10, padding: '16px', marginBottom: '1rem' },
  cardTitle: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, margin: '0 0 14px 0', color: '#1a1a18' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fafaf8', width: '100%', boxSizing: 'border-box' },
  btn: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500, padding: '10px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  error: { fontSize: 13, color: '#c0392b', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" },
  ok: { fontSize: 13, color: '#27ae60', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }
};
