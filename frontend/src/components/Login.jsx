import React, { useState } from 'react';
import { login } from '../api';
import { getTheme } from '../theme';

export default function Login({ onLogin }) {
  const t = getTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(username, password);
      onLogin(user);
    } catch { setError('Benutzername oder Passwort falsch'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, padding: '1rem' }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontFamily: t.fontMono, fontSize: 28, fontWeight: 500, margin: '0 0 4px 0', color: t.text }}>Rundgang</h1>
        <p style={{ fontSize: 14, color: t.textMuted, margin: '0 0 2rem 0', fontFamily: t.fontSans }}>Ticket-Erfassung</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={{ fontFamily: t.fontSans, fontSize: 15, padding: '10px 14px', border: `1px solid ${t.border}`, borderRadius: 8, outline: 'none', background: t.surfaceAlt, color: t.text }}
            type="text" placeholder="Benutzername" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
          <input style={{ fontFamily: t.fontSans, fontSize: 15, padding: '10px 14px', border: `1px solid ${t.border}`, borderRadius: 8, outline: 'none', background: t.surfaceAlt, color: t.text }}
            type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p style={{ fontSize: 13, color: t.danger, margin: 0, fontFamily: t.fontSans }}>{error}</p>}
          <button style={{ fontFamily: t.fontSans, fontSize: 15, fontWeight: 500, padding: '11px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}
            type="submit" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
