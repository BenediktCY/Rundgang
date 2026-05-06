import React, { useState } from 'react';
import { updateUser } from '../api';
import { THEMES, getThemeKey, setThemeKey } from '../theme';

export default function Einstellungen({ user, onBack, onUserUpdate, onLogout, onThemeChange }) {
  const [themeKey, setThemeKeyState] = useState(getThemeKey());
  const [pwForm, setPwForm] = useState({ alt: '', neu: '', neu2: '' });
  const [usernameVal, setUsernameVal] = useState(user.username);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [unError, setUnError] = useState('');
  const [unOk, setUnOk] = useState('');
  const [saving, setSaving] = useState(false);

  const t = THEMES[themeKey];

  function handleThemeChange(key) {
    setThemeKeyState(key);
    setThemeKey(key);
    onThemeChange(key);
  }

  async function handleUsernameChange(e) {
    e.preventDefault(); setUnError(''); setUnOk('');
    if (!usernameVal.trim()) { setUnError('Benutzername darf nicht leer sein'); return; }
    if (usernameVal === user.username) { setUnError('Kein neuer Benutzername eingegeben'); return; }
    setSaving(true);
    try {
      await updateUser(user.id, { username: usernameVal.trim().toLowerCase() });
      onUserUpdate({ ...user, username: usernameVal.trim().toLowerCase() });
      setUnOk('Gespeichert');
    } catch(err) { setUnError(err.message); }
    finally { setSaving(false); }
  }

  async function handlePwChange(e) {
    e.preventDefault(); setPwError(''); setPwOk('');
    if (!pwForm.alt || !pwForm.neu || !pwForm.neu2) { setPwError('Alle Felder ausfüllen'); return; }
    if (pwForm.neu !== pwForm.neu2) { setPwError('Passwörter stimmen nicht überein'); return; }
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
    } catch { setPwError('Fehler'); }
    finally { setSaving(false); }
  }

  const s = makeStyles(t);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={onBack}>← Zurück</button>
          <h2 style={s.title}>Einstellungen</h2>
        </div>

        {/* Profil-Info */}
        <div style={s.infoBox}>
          <span style={s.infoUsername}>@{user.username}</span>
          <span style={s.infoMeta}>{user.abteilung || 'keine Abteilung'} · {user.role === 'pruefer' ? 'Prüfer' : 'Mitarbeiter'}</span>
        </div>

        {/* Theme */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Darstellung</h3>
          <div style={s.themeGrid}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <button key={key} style={{ ...s.themeCard, ...(themeKey === key ? s.themeCardActive : {}) }}
                onClick={() => handleThemeChange(key)}>
                <div style={{ ...s.themePreview, background: theme.bg, border: `2px solid ${theme.border}` }}>
                  <div style={{ width: '60%', height: 6, background: theme.accent, borderRadius: 3, marginBottom: 4 }} />
                  <div style={{ width: '100%', height: 4, background: theme.border, borderRadius: 2, marginBottom: 3 }} />
                  <div style={{ width: '80%', height: 4, background: theme.border, borderRadius: 2 }} />
                </div>
                <span style={{ ...s.themeName, color: themeKey === key ? t.accent : t.text }}>{theme.name}</span>
                <span style={s.themeDesc}>{theme.description}</span>
                {themeKey === key && <span style={{ ...s.themeCheck, color: t.accent }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Benutzername */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Benutzername ändern</h3>
          <form onSubmit={handleUsernameChange} style={s.form}>
            <Field label="Neuer Benutzername" t={t}>
              <input style={s.input} value={usernameVal} onChange={e => setUsernameVal(e.target.value)} autoCapitalize="none" />
            </Field>
            {unError && <p style={s.error}>{unError}</p>}
            {unOk && <p style={s.ok}>{unOk}</p>}
            <button style={s.btn} type="submit" disabled={saving}>Speichern</button>
          </form>
        </div>

        {/* Passwort */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Passwort ändern</h3>
          <form onSubmit={handlePwChange} style={s.form}>
            <Field label="Aktuelles Passwort" t={t}>
              <input style={s.input} type="password" value={pwForm.alt} onChange={e => setPwForm(f => ({ ...f, alt: e.target.value }))} />
            </Field>
            <Field label="Neues Passwort" t={t}>
              <input style={s.input} type="password" value={pwForm.neu} onChange={e => setPwForm(f => ({ ...f, neu: e.target.value }))} />
            </Field>
            <Field label="Wiederholen" t={t}>
              <input style={s.input} type="password" value={pwForm.neu2} onChange={e => setPwForm(f => ({ ...f, neu2: e.target.value }))} />
            </Field>
            {pwError && <p style={s.error}>{pwError}</p>}
            {pwOk && <p style={s.ok}>{pwOk}</p>}
            <button style={s.btn} type="submit" disabled={saving}>Passwort ändern</button>
          </form>
        </div>

        {/* Abmelden */}
        <button style={s.logoutBtn} onClick={onLogout}>Abmelden</button>
      </div>
    </div>
  );
}

function Field({ label, children, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans }}>{label}</label>
      {children}
    </div>
  );
}

function makeStyles(t) {
  return {
    page: { minHeight: '100vh', background: t.bg },
    container: { padding: '1rem', maxWidth: 480, margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem', paddingTop: '0.5rem' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 14, padding: 0, fontFamily: t.fontSans },
    title: { fontFamily: t.fontMono, fontSize: 20, fontWeight: 500, margin: 0, color: t.text },
    infoBox: { background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 3 },
    infoUsername: { fontFamily: t.fontMono, fontSize: 16, fontWeight: 600, color: t.text },
    infoMeta: { fontFamily: t.fontSans, fontSize: 12, color: t.textMuted },
    card: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px', marginBottom: '1rem' },
    cardTitle: { fontFamily: t.fontSans, fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em' },
    themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
    themeCard: { background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', position: 'relative', transition: 'border-color 0.15s' },
    themeCardActive: { border: `2px solid ${t.accent}` },
    themePreview: { width: '100%', borderRadius: 6, padding: '8px', boxSizing: 'border-box', marginBottom: 4 },
    themeName: { fontFamily: t.fontSans, fontSize: 13, fontWeight: 600 },
    themeDesc: { fontFamily: t.fontSans, fontSize: 11, color: t.textMuted, textAlign: 'center' },
    themeCheck: { position: 'absolute', top: 6, right: 8, fontSize: 12, fontWeight: 700 },
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    input: { fontFamily: t.fontSans, fontSize: 14, padding: '9px 12px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surfaceAlt, color: t.text, width: '100%', boxSizing: 'border-box' },
    btn: { fontFamily: t.fontSans, fontSize: 14, fontWeight: 500, padding: '10px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
    logoutBtn: { width: '100%', fontFamily: t.fontSans, fontSize: 15, fontWeight: 600, padding: '13px', background: t.dangerBg, color: t.danger, border: `1px solid ${t.danger}`, borderRadius: 10, cursor: 'pointer', marginTop: 8, marginBottom: '2rem' },
    error: { fontSize: 13, color: t.danger, margin: 0, fontFamily: t.fontSans },
    ok: { fontSize: 13, color: t.success, margin: 0, fontFamily: t.fontSans },
  };
}
