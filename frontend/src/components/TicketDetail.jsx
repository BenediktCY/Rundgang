import React, { useState, useEffect } from 'react';
import { getTicket, updateTicket, deleteTicket, addKommentar, getStammdaten } from '../api';

const STATUS_LABELS = { offen: 'Offen', in_bearbeitung: 'In Bearbeitung', zur_pruefung: 'Zur Prüfung', abgeschlossen: 'Abgeschlossen' };

function statusColors(t) {
  const isDark = t.bg !== '#f5f5f3';
  return isDark ? {
    offen: { bg: '#2d1f00', color: '#ff9800' },
    in_bearbeitung: { bg: '#001a2d', color: '#4a9eff' },
    zur_pruefung: { bg: '#1a0d2d', color: '#bb86fc' },
    abgeschlossen: { bg: '#0d2d14', color: '#4caf50' }
  } : {
    offen: { bg: '#fff3e0', color: '#e65100' },
    in_bearbeitung: { bg: '#e3f2fd', color: '#1565c0' },
    zur_pruefung: { bg: '#f3e5f5', color: '#6a1b9a' },
    abgeschlossen: { bg: '#e8f5e9', color: '#2e7d32' }
  };
}

function getActions(ticket, user) {
  if (user.role === 'pruefer') {
    if (ticket.status === 'offen') return [{ value: 'in_bearbeitung', label: 'In Bearbeitung nehmen' }];
    if (ticket.status === 'in_bearbeitung') return [{ value: 'zur_pruefung', label: 'Zur Prüfung senden' }];
    if (ticket.status === 'zur_pruefung') return [{ value: 'abgeschlossen', label: 'Abschließen ✓' }, { value: 'in_bearbeitung', label: 'Zurückweisen' }];
    return [];
  }
  if (ticket.abteilung !== user.abteilung) return [];
  if (ticket.status === 'offen') return [{ value: 'in_bearbeitung', label: 'In Bearbeitung nehmen' }];
  if (ticket.status === 'in_bearbeitung') return [{ value: 'zur_pruefung', label: 'Zur Prüfung senden' }];
  return [];
}

export default function TicketDetail({ ticketId, user, theme: t, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [raeume, setRaeume] = useState([]);
  const [abteilungen, setAbteilungen] = useState([]);
  const [kommentar, setKommentar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    getStammdaten('raum').then(r => setRaeume(r.map(x => x.wert)));
    getStammdaten('abteilung').then(a => setAbteilungen(a.map(x => x.wert)));
  }, [ticketId]);

  async function load() {
    setLoading(true);
    const data = await getTicket(ticketId);
    setTicket(data);
    setEditForm({ titel: data.titel, beschreibung: data.beschreibung, raum: data.raum, abteilung: data.abteilung, dringlichkeit: data.dringlichkeit, faellig: data.faellig || '' });
    setLoading(false);
  }

  const canEdit = ticket && (user.role === 'pruefer' || ticket.erstellt_von === user.id);

  async function handleSaveEdit(e) {
    e.preventDefault(); setSaving(true); setError('');
    try { await updateTicket(ticketId, { ...editForm, requester_id: user.id }); setEditing(false); await load(); }
    catch(err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Ticket wirklich löschen?')) return;
    try { await deleteTicket(ticketId, user.id); onBack(); }
    catch(err) { setError(err.message); }
  }

  async function changeStatus(newStatus) {
    setSaving(true);
    const typ = newStatus === 'in_bearbeitung' && ticket.status === 'zur_pruefung' ? 'pruefung_abgelehnt'
      : newStatus === 'abgeschlossen' ? 'pruefung_ok' : 'status';
    if (kommentar.trim()) await addKommentar(ticketId, { autor_id: user.id, text: kommentar, typ });
    await updateTicket(ticketId, { status: newStatus, requester_id: user.id });
    setKommentar(''); await load(); setSaving(false);
  }

  async function submitKommentar() {
    if (!kommentar.trim()) return;
    setSaving(true);
    await addKommentar(ticketId, { autor_id: user.id, text: kommentar, typ: 'kommentar' });
    setKommentar(''); await load(); setSaving(false);
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: t.textMuted, fontFamily: t.fontSans }}>Laden...</div>;
  if (!ticket) return null;

  const SC = statusColors(t);
  const actions = getActions(ticket, user);
  const inp = { fontFamily: t.fontSans, fontSize: 14, padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surfaceAlt, color: t.text, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '1rem', maxWidth: 680, margin: '0 auto', paddingTop: '3.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 14, padding: 0, fontFamily: t.fontSans }} onClick={onBack}>← Zurück</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && !editing && (ticket.status === 'offen' || user.role === 'pruefer') && (
            <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '6px 14px', background: t.surfaceAlt, color: t.text, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }} onClick={() => setEditing(true)}>Bearbeiten</button>
          )}
          {canEdit && (
            <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '6px 14px', background: t.dangerBg, color: t.danger, border: `1px solid ${t.danger}`, borderRadius: 8, cursor: 'pointer' }} onClick={handleDelete}>Löschen</button>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <F label="Titel" t={t}><input style={inp} value={editForm.titel} onChange={e => setEditForm(f => ({ ...f, titel: e.target.value }))} /></F>
          <F label="Beschreibung" t={t}><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={editForm.beschreibung} onChange={e => setEditForm(f => ({ ...f, beschreibung: e.target.value }))} /></F>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <F label="Raum" t={t}><select style={inp} value={editForm.raum} onChange={e => setEditForm(f => ({ ...f, raum: e.target.value }))}>{raeume.map(r => <option key={r} value={r}>{r}</option>)}</select></F>
            <F label="Abteilung" t={t}><select style={inp} value={editForm.abteilung} onChange={e => setEditForm(f => ({ ...f, abteilung: e.target.value }))} disabled={user.role !== 'pruefer'}>{abteilungen.map(a => <option key={a} value={a}>{a}</option>)}</select></F>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <F label="Dringlichkeit" t={t}><select style={inp} value={editForm.dringlichkeit} onChange={e => setEditForm(f => ({ ...f, dringlichkeit: e.target.value }))}><option value="normal">Normal</option><option value="dringend">Dringend</option></select></F>
            <F label="Fällig bis" t={t}><input style={inp} type="date" value={editForm.faellig} onChange={e => setEditForm(f => ({ ...f, faellig: e.target.value }))} /></F>
          </div>
          {error && <p style={{ fontSize: 13, color: t.danger, margin: 0, fontFamily: t.fontSans }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ fontFamily: t.fontSans, fontSize: 13, fontWeight: 500, padding: '9px 18px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' }} type="submit" disabled={saving}>Speichern</button>
            <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '9px 14px', background: t.surfaceAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }} type="button" onClick={() => setEditing(false)}>Abbrechen</button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: t.textLight, fontFamily: t.fontMono }}>#{ticket.id}</span>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, ...SC[ticket.status] }}>{STATUS_LABELS[ticket.status]}</span>
            {ticket.dringlichkeit === 'dringend' && <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: t.dangerBg, color: t.danger }}>⚠ Dringend</span>}
          </div>
          <h2 style={{ fontFamily: t.fontSans, fontSize: 20, fontWeight: 500, margin: '0 0 1.25rem 0', color: t.text }}>{ticket.titel}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px 20px', marginBottom: '1.5rem' }}>
            {[['Raum', ticket.raum], ['Abteilung', ticket.abteilung], ['Erstellt von', ticket.erstellt_von_name], ['Erstellt am', new Date(ticket.erstellt_am).toLocaleDateString('de-DE')]].map(([label, val]) => (
              <div key={label}>
                <span style={{ fontSize: 11, fontWeight: 500, color: t.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans, display: 'block' }}>{label}</span>
                <span style={{ fontSize: 14, color: t.text, fontFamily: t.fontSans }}>{val}</span>
              </div>
            ))}
            {ticket.faellig && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: t.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans, display: 'block' }}>Fällig bis</span>
                <span style={{ fontSize: 14, fontFamily: t.fontSans, color: new Date(ticket.faellig) < new Date() && ticket.status !== 'abgeschlossen' ? t.danger : t.text }}>{new Date(ticket.faellig).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: t.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0', fontFamily: t.fontSans }}>Beschreibung</p>
            <p style={{ fontSize: 15, color: t.text, lineHeight: 1.6, margin: 0, fontFamily: t.fontSans }}>{ticket.beschreibung}</p>
          </div>
        </>
      )}

      {!editing && ticket.kommentare?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: t.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0', fontFamily: t.fontSans }}>Verlauf</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ticket.kommentare.map(k => (
              <div key={k.id} style={{ background: k.typ === 'pruefung_ok' ? '#0d2d14' : k.typ === 'pruefung_abgelehnt' ? t.dangerBg : t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: t.textMuted, fontFamily: t.fontSans }}>{k.autor_name}</span>
                  <span style={{ fontSize: 12, color: t.textLight, fontFamily: t.fontSans }}>{new Date(k.erstellt_am).toLocaleDateString('de-DE')}</span>
                </div>
                <p style={{ fontSize: 14, color: t.text, margin: 0, fontFamily: t.fontSans }}>{k.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!editing && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: t.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0', fontFamily: t.fontSans }}>Kommentar</p>
          <textarea style={{ fontFamily: t.fontSans, fontSize: 14, padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surfaceAlt, color: t.text, width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 8 }}
            placeholder="Notiz..." value={kommentar} onChange={e => setKommentar(e.target.value)} rows={3} />
          <button style={{ fontFamily: t.fontSans, fontSize: 13, padding: '8px 16px', background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', color: t.text }}
            onClick={submitKommentar} disabled={saving || !kommentar.trim()}>Kommentar speichern</button>
        </div>
      )}

      {!editing && actions.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: '1rem', borderTop: `1px solid ${t.border}` }}>
          {actions.map(a => (
            <button key={a.value} style={{
              fontFamily: t.fontSans, fontSize: 14, fontWeight: 500, padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', flex: 1,
              background: a.value === 'abgeschlossen' ? t.success : a.value === 'in_bearbeitung' && ticket.status === 'zur_pruefung' ? t.dangerBg : t.accent,
              color: a.value === 'in_bearbeitung' && ticket.status === 'zur_pruefung' ? t.danger : t.accentText,
              ...(a.value === 'in_bearbeitung' && ticket.status === 'zur_pruefung' ? { border: `1px solid ${t.danger}` } : {})
            }} onClick={() => changeStatus(a.value)} disabled={saving}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function F({ label, children, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans }}>{label}</label>
      {children}
    </div>
  );
}
