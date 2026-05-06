import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getStammdaten, addStammdaten, deleteStammdaten } from '../api';

const TABS = ['Mitarbeiter', 'Räume', 'Abteilungen'];

export default function AdminPanel({ theme: t, onBack }) {
  const [tab, setTab] = useState('Mitarbeiter');
  const inp = { fontFamily: t.fontSans, fontSize: 14, padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surfaceAlt, color: t.text, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '1rem', maxWidth: 680, margin: '0 auto', paddingTop: '3.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 14, padding: 0, fontFamily: t.fontSans }} onClick={onBack}>← Zurück</button>
        <h2 style={{ fontFamily: t.fontMono, fontSize: 20, fontWeight: 500, margin: 0, color: t.text }}>Administration</h2>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: `1px solid ${t.border}` }}>
        {TABS.map(tb => (
          <button key={tb} style={{ fontFamily: t.fontSans, fontSize: 14, padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', color: tab === tb ? t.text : t.textMuted, fontWeight: tab === tb ? 600 : 400, borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent', marginBottom: -1 }}
            onClick={() => setTab(tb)}>{tb}</button>
        ))}
      </div>
      {tab === 'Mitarbeiter' && <MitarbeiterTab t={t} inp={inp} />}
      {tab === 'Räume' && <StammdatenTab typ="raum" label="Räume" t={t} inp={inp} />}
      {tab === 'Abteilungen' && <StammdatenTab typ="abteilung" label="Abteilungen" t={t} inp={inp} />}
    </div>
  );
}

function MitarbeiterTab({ t, inp }) {
  const [users, setUsers] = useState([]);
  const [abteilungen, setAbteilungen] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPw, setResetPw] = useState({ id: null, pw: '' });
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', role: 'mitarbeiter', abteilung: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setUsers(await getUsers());
    setAbteilungen((await getStammdaten('abteilung')).map(x => x.wert));
  }

  async function handleCreate(e) {
    e.preventDefault(); setError('');
    try { await createUser(form); setForm({ username: '', password: '', role: 'mitarbeiter', abteilung: '' }); setShowForm(false); load(); }
    catch(err) { setError(err.message); }
  }

  async function handleSaveEdit(e) {
    e.preventDefault(); setError('');
    try { await updateUser(editUser.id, { username: editUser.username, role: editUser.role, abteilung: editUser.abteilung }); setEditUser(null); load(); }
    catch(err) { setError(err.message); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: t.textMuted, fontFamily: t.fontSans }}>Mitarbeiter ({users.length})</span>
        <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '7px 14px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => { setShowForm(true); setEditUser(null); }}>+ Hinzufügen</button>
      </div>
      {error && <p style={{ fontSize: 13, color: t.danger, margin: '0 0 8px 0', fontFamily: t.fontSans }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 16px' }}>
            <F label="Benutzername *" t={t}><input style={inp} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoCapitalize="none" /></F>
            <F label="Passwort *" t={t}><input style={inp} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></F>
            <F label="Abteilung" t={t}>
              <select style={inp} value={form.abteilung} onChange={e => setForm(f => ({ ...f, abteilung: e.target.value }))}>
                <option value="">– keine –</option>
                {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </F>
            <F label="Rolle" t={t}>
              <select style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="mitarbeiter">Mitarbeiter</option>
                <option value="pruefer">Prüfer</option>
              </select>
            </F>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={{ fontFamily: t.fontSans, fontSize: 13, fontWeight: 500, padding: '8px 16px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }} type="submit">Anlegen</button>
            <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '8px 14px', background: t.surfaceAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }} type="button" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px' }}>
            {editUser?.id === u.id ? (
              <form onSubmit={handleSaveEdit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 16px' }}>
                  <F label="Benutzername" t={t}><input style={inp} value={editUser.username} onChange={e => setEditUser(eu => ({ ...eu, username: e.target.value }))} /></F>
                  <F label="Abteilung" t={t}>
                    <select style={inp} value={editUser.abteilung || ''} onChange={e => setEditUser(eu => ({ ...eu, abteilung: e.target.value }))}>
                      <option value="">– keine –</option>
                      {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </F>
                  <F label="Rolle" t={t}>
                    <select style={inp} value={editUser.role} onChange={e => setEditUser(eu => ({ ...eu, role: e.target.value }))}>
                      <option value="mitarbeiter">Mitarbeiter</option>
                      <option value="pruefer">Prüfer</option>
                    </select>
                  </F>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ fontFamily: t.fontSans, fontSize: 13, fontWeight: 500, padding: '8px 16px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }} type="submit">Speichern</button>
                  <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '8px 14px', background: t.surfaceAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }} type="button" onClick={() => setEditUser(null)}>Abbrechen</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: t.fontMono, fontSize: 15, fontWeight: 500, margin: '0 0 3px 0', color: t.text }}>@{u.username}</p>
                  <p style={{ fontFamily: t.fontSans, fontSize: 12, color: t.textMuted, margin: 0 }}>{u.abteilung || 'keine Abteilung'} · <span style={{ color: u.role === 'pruefer' ? t.accent : t.textMuted }}>{u.role === 'pruefer' ? 'Prüfer' : 'Mitarbeiter'}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 14, color: t.textMuted }} onClick={() => setEditUser({ ...u })}>✎</button>
                  <button style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 14, color: t.textMuted }} onClick={() => setResetPw(r => ({ id: r.id === u.id ? null : u.id, pw: '' }))}>🔑</button>
                  {u.username !== 'admin' && <button style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 14, color: t.danger }} onClick={async () => { if(confirm(`"${u.username}" löschen?`)) { await deleteUser(u.id); load(); } }}>✕</button>}
                </div>
              </div>
            )}
            {resetPw.id === u.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <input style={{ ...inp, flex: 1 }} type="text" placeholder="Neues Passwort" value={resetPw.pw} onChange={e => setResetPw(r => ({ ...r, pw: e.target.value }))} />
                <button style={{ fontFamily: t.fontSans, fontSize: 13, fontWeight: 500, padding: '8px 16px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }} onClick={async () => { await updateUser(u.id, { password: resetPw.pw }); setResetPw({ id: null, pw: '' }); }}>Setzen</button>
                <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '8px 14px', background: t.surfaceAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }} onClick={() => setResetPw({ id: null, pw: '' })}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StammdatenTab({ typ, label, t, inp }) {
  const [items, setItems] = useState([]);
  const [neu, setNeu] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [typ]);
  async function load() { setItems(await getStammdaten(typ)); }

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, color: t.textMuted, fontFamily: t.fontSans, marginBottom: '1rem' }}>{label} ({items.length})</p>
      <form onSubmit={async e => { e.preventDefault(); if(!neu.trim()) return; try { await addStammdaten(typ, neu.trim()); setNeu(''); load(); } catch(err) { setError(err.message); } }} style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <input style={{ ...inp, flex: 1 }} value={neu} onChange={e => setNeu(e.target.value)} placeholder="Neuer Eintrag..." />
        <button style={{ fontFamily: t.fontSans, fontSize: 13, fontWeight: 500, padding: '8px 16px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }} type="submit">Hinzufügen</button>
      </form>
      {error && <p style={{ fontSize: 13, color: t.danger, margin: '0 0 8px 0', fontFamily: t.fontSans }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 20, padding: '6px 12px', fontSize: 13, fontFamily: t.fontSans, color: t.text }}>
            <span>{item.wert}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textLight, fontSize: 12, padding: 0 }} onClick={() => deleteStammdaten(item.id).then(load)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function F({ label, children, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans }}>{label}</label>
      {children}
    </div>
  );
}
