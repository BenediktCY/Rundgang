import React, { useState, useEffect } from 'react';
import { getTickets } from '../api';

const STATUS_LABELS = {
  offen: 'Offen', in_bearbeitung: 'In Bearbeitung',
  zur_pruefung: 'Zur Prüfung', abgeschlossen: 'Abgeschlossen'
};
const STATUS_COLORS_LIGHT = {
  offen: { bg: '#fff3e0', color: '#e65100' },
  in_bearbeitung: { bg: '#e3f2fd', color: '#1565c0' },
  zur_pruefung: { bg: '#f3e5f5', color: '#6a1b9a' },
  abgeschlossen: { bg: '#e8f5e9', color: '#2e7d32' }
};
const STATUS_COLORS_DARK = {
  offen: { bg: '#2d1f00', color: '#ff9800' },
  in_bearbeitung: { bg: '#001a2d', color: '#4a9eff' },
  zur_pruefung: { bg: '#1a0d2d', color: '#bb86fc' },
  abgeschlossen: { bg: '#0d2d14', color: '#4caf50' }
};

function statusColors(t) {
  return t.bg === '#f5f5f3' ? STATUS_COLORS_LIGHT : STATUS_COLORS_DARK;
}

export default function TicketList({ user, theme: t, onSelect, onNew, onAdmin, onDashboard, onEinstellungen }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('aktiv');
  const SC = statusColors(t);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setTickets(await getTickets());
    setLoading(false);
  }

  const isPruefer = user.role === 'pruefer';
  const meineTickets = tickets.filter(t => t.erstellt_von === user.id);
  const abteilungsTickets = tickets.filter(t => t.abteilung === user.abteilung && t.erstellt_von !== user.id);

  const filtered = tickets.filter(tk => {
    if (filter === 'aktiv') return tk.status !== 'abgeschlossen';
    if (filter === 'pruefung') return tk.status === 'zur_pruefung';
    if (filter === 'dringend') return tk.dringlichkeit === 'dringend' && tk.status !== 'abgeschlossen';
    if (filter === 'abgeschlossen') return tk.status === 'abgeschlossen';
    return true;
  });

  const counts = {
    aktiv: tickets.filter(t => t.status !== 'abgeschlossen').length,
    pruefung: tickets.filter(t => t.status === 'zur_pruefung').length,
    dringend: tickets.filter(t => t.dringlichkeit === 'dringend' && t.status !== 'abgeschlossen').length,
    abgeschlossen: tickets.filter(t => t.status === 'abgeschlossen').length,
  };

  const s = makeStyles(t);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Rundgang</h1>
          <p style={s.userLine}>{user.username} · {isPruefer ? 'Prüfer' : (user.abteilung || 'Mitarbeiter')}</p>
        </div>
        <div style={s.headerBtns}>
          <button style={s.ghostBtn} onClick={onDashboard}>Dashboard</button>
          {isPruefer && <button style={s.ghostBtn} onClick={onAdmin}>⚙ Admin</button>}
          <button style={s.newBtn} onClick={onNew}>+ Neu</button>
        </div>
      </div>

      {/* Statusübersicht */}
      <div style={s.statusGrid}>
        {['offen','in_bearbeitung','zur_pruefung','abgeschlossen'].map(st => (
          <div key={st} style={{ ...s.statusCard, background: SC[st].bg }}>
            <span style={{ ...s.statusCount, color: SC[st].color }}>{tickets.filter(tk => tk.status === st).length}</span>
            <span style={{ ...s.statusLabel, color: SC[st].color }}>{STATUS_LABELS[st]}</span>
          </div>
        ))}
      </div>

      {loading ? <p style={s.muted}>Laden...</p> : isPruefer ? (
        <>
          <div style={s.filterRow}>
            {[
              { key: 'aktiv', label: 'Aktiv', count: counts.aktiv },
              { key: 'pruefung', label: 'Zur Prüfung', count: counts.pruefung },
              { key: 'dringend', label: '⚠ Dringend', count: counts.dringend },
              { key: 'abgeschlossen', label: 'Abgeschlossen', count: counts.abgeschlossen },
              { key: 'alle', label: 'Alle' },
            ].map(f => (
              <button key={f.key} style={{ ...s.filterBtn, ...(filter === f.key ? s.filterActive : {}) }}
                onClick={() => setFilter(f.key)}>
                {f.label}{f.count > 0 ? ` (${f.count})` : ''}
              </button>
            ))}
          </div>
          <TicketGruppe tickets={filtered} onSelect={onSelect} t={t} SC={SC} emptyText="Keine Tickets" />
        </>
      ) : (
        <>
          <Section title="Meine erstellten Tickets" count={meineTickets.length} t={t}>
            <TicketGruppe tickets={meineTickets} onSelect={onSelect} t={t} SC={SC} emptyText="Noch keine eigenen Tickets" />
          </Section>
          <Section title={`Abteilung${user.abteilung ? ` – ${user.abteilung}` : ''}`} count={abteilungsTickets.length} t={t}>
            {!user.abteilung
              ? <p style={s.muted}>Keine Abteilung zugewiesen</p>
              : <TicketGruppe tickets={abteilungsTickets} onSelect={onSelect} t={t} SC={SC} emptyText="Keine Tickets für deine Abteilung" />
            }
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, count, children, t }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <h2 style={{ fontFamily: t.fontSans, fontSize: 12, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, color: t.textLight, fontFamily: t.fontMono }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function TicketGruppe({ tickets, onSelect, t, SC, emptyText }) {
  if (tickets.length === 0) return <p style={{ color: t.textLight, fontSize: 14, margin: 0, fontFamily: t.fontSans }}>{emptyText}</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tickets.map(tk => <TicketCard key={tk.id} ticket={tk} onSelect={onSelect} t={t} SC={SC} />)}
    </div>
  );
}

function TicketCard({ ticket: tk, onSelect, t, SC }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderLeft: tk.dringlichkeit === 'dringend' ? `3px solid ${t.danger}` : `1px solid ${t.border}`,
      borderRadius: 10, padding: '14px 16px', cursor: 'pointer'
    }} onClick={() => onSelect(tk.id)}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: t.textLight, fontFamily: t.fontMono }}>#{tk.id}</span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, ...SC[tk.status] }}>{STATUS_LABELS[tk.status]}</span>
        {tk.dringlichkeit === 'dringend' && <span style={{ fontSize: 12, color: t.danger }}>⚠</span>}
      </div>
      <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px 0', color: t.text, fontFamily: t.fontSans }}>{tk.titel}</p>
      <div style={{ fontSize: 12, color: t.textMuted, display: 'flex', gap: 4, flexWrap: 'wrap', fontFamily: t.fontSans }}>
        <span>{tk.raum}</span><span style={{ color: t.textLight }}>·</span><span>{tk.abteilung}</span>
        {tk.faellig && <>
          <span style={{ color: t.textLight }}>·</span>
          <span style={{ color: new Date(tk.faellig) < new Date() && tk.status !== 'abgeschlossen' ? t.danger : t.textMuted }}>
            bis {new Date(tk.faellig).toLocaleDateString('de-DE')}
          </span>
        </>}
      </div>
      <p style={{ fontSize: 12, color: t.textLight, margin: '4px 0 0 0', fontFamily: t.fontSans }}>von {tk.erstellt_von_name}</p>
    </div>
  );
}

function makeStyles(t) {
  return {
    container: { padding: '1rem', maxWidth: 680, margin: '0 auto', paddingTop: '3.5rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 },
    title: { fontFamily: t.fontMono, fontSize: 24, fontWeight: 500, margin: '0 0 2px 0', color: t.text },
    userLine: { fontSize: 13, color: t.textMuted, margin: 0, fontFamily: t.fontSans },
    headerBtns: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    ghostBtn: { fontFamily: t.fontSans, fontSize: 13, padding: '8px 14px', background: t.surfaceAlt, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' },
    newBtn: { fontFamily: t.fontSans, fontSize: 14, fontWeight: 500, padding: '9px 18px', background: t.accent, color: t.accentText, border: 'none', borderRadius: 8, cursor: 'pointer' },
    statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.5rem' },
    statusCard: { borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 2 },
    statusCount: { fontSize: 22, fontWeight: 600, fontFamily: t.fontMono },
    statusLabel: { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: t.fontSans },
    filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' },
    filterBtn: { fontFamily: t.fontSans, fontSize: 13, padding: '6px 12px', border: `1px solid ${t.border}`, borderRadius: 20, background: t.surfaceAlt, cursor: 'pointer', color: t.textMuted },
    filterActive: { background: t.accent, color: t.accentText, border: `1px solid ${t.accent}` },
    muted: { color: t.textLight, fontSize: 14, fontFamily: t.fontSans },
  };
}
