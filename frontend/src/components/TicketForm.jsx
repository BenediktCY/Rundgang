import React, { useState, useEffect } from 'react';
import { createTicket, getStammdaten } from '../api';

export default function TicketForm({ user, theme: t, onSave, onCancel }) {
  const [raeume, setRaeume] = useState([]);
  const [abteilungen, setAbteilungen] = useState([]);
  const [form, setForm] = useState({ titel: '', beschreibung: '', raum: '', abteilung: user.abteilung || '', dringlichkeit: 'normal', faellig: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStammdaten('raum').then(r => setRaeume(r.map(x => x.wert)));
    getStammdaten('abteilung').then(a => setAbteilungen(a.map(x => x.wert)));
  }, []);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titel || !form.beschreibung || !form.raum || !form.abteilung) { setError('Bitte alle Pflichtfelder ausfüllen'); return; }
    setLoading(true);
    try { await createTicket({ ...form, erstellt_von: user.id }); onSave(); }
    catch { setError('Fehler beim Speichern'); }
    finally { setLoading(false); }
  }

  const inp = { fontFamily: t.fontSans, fontSize: 15, padding: '9px 12px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surfaceAlt, color: t.text, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto', paddingTop: '3.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: t.fontMono, fontSize: 20, fontWeight: 500, margin: 0, color: t.text }}>Neues Ticket</h2>
        <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: t.textMuted }} onClick={onCancel}>✕</button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <F label="Titel *" t={t}><input style={inp} value={form.titel} onChange={e => set('titel', e.target.value)} placeholder="Kurze Beschreibung" /></F>
        <F label="Beschreibung *" t={t}><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.beschreibung} onChange={e => set('beschreibung', e.target.value)} placeholder="Details" /></F>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <F label="Raum *" t={t}>
            <select style={inp} value={form.raum} onChange={e => set('raum', e.target.value)}>
              <option value="">– wählen –</option>
              {raeume.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </F>
          <F label="Abteilung *" t={t}>
            <select style={inp} value={form.abteilung} onChange={e => set('abteilung', e.target.value)}>
              <option value="">– wählen –</option>
              {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <F label="Dringlichkeit" t={t}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['normal','dringend'].map(d => (
                <button key={d} type="button"
                  style={{ fontFamily: t.fontSans, fontSize: 14, padding: '8px 16px', border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer',
                    background: form.dringlichkeit === d ? (d === 'dringend' ? t.danger : t.accent) : t.surfaceAlt,
                    color: form.dringlichkeit === d ? t.accentText : t.textMuted }}
                  onClick={() => set('dringlichkeit', d)}>
                  {d === 'dringend' ? '⚠ Dringend' : 'Normal'}
                </button>
              ))}
            </div>
          </F>
          <F label="Fällig bis" t={t}><input style={inp} type="date" value={form.faellig} onChange={e => set('faellig', e.target.value)} /></F>
        </div>
        {error && <p style={{ fontSize: 13, color: t.danger, margin: 0, fontFamily: t.fontSans }}>{error}</p>}
        <button style={{ fontFamily: t.fontSans, fontSize: 15, fontWeight: 500, padding: '12px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8 }}
          type="submit" disabled={loading}>{loading ? 'Speichern...' : 'Ticket erstellen'}</button>
      </form>
    </div>
  );
}

function F({ label, children, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans }}>{label}</label>
      {children}
    </div>
  );
}
