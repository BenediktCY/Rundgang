import React, { useState, useEffect } from 'react';
import { getTickets } from '../api';

const STATUS_LABELS = { offen: 'Offen', in_bearbeitung: 'In Bearbeitung', zur_pruefung: 'Zur Prüfung', abgeschlossen: 'Abgeschlossen' };

export default function Dashboard({ theme: t, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getTickets().then(tk => { setTickets(tk); setLoading(false); }); }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: t.textMuted, fontFamily: t.fontSans }}>Laden...</div>;

  const total = tickets.length;
  const statuses = ['offen','in_bearbeitung','zur_pruefung','abgeschlossen'];
  const isDark = t.bg !== '#f5f5f3';

  const SC = isDark ? {
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

  const abteilungMap = {};
  tickets.forEach(tk => {
    if (!abteilungMap[tk.abteilung]) abteilungMap[tk.abteilung] = { offen:0, in_bearbeitung:0, zur_pruefung:0, abgeschlossen:0, total:0 };
    abteilungMap[tk.abteilung][tk.status]++;
    abteilungMap[tk.abteilung].total++;
  });
  const abteilungen = Object.entries(abteilungMap).sort((a,b) => b[1].total - a[1].total);
  const today = new Date();
  const ueberfaellig = tickets.filter(tk => tk.faellig && new Date(tk.faellig) < today && tk.status !== 'abgeschlossen').length;
  const dringend = tickets.filter(tk => tk.dringlichkeit === 'dringend' && tk.status !== 'abgeschlossen').length;

  return (
    <div style={{ minHeight: '100vh', background: t.bg, padding: '1rem', paddingTop: '3.5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 14, padding: 0, fontFamily: t.fontSans }} onClick={onBack}>← Zurück</button>
          <h2 style={{ fontFamily: t.fontMono, fontSize: 20, fontWeight: 500, margin: 0, color: t.text }}>Dashboard</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
          {[
            { label: 'Gesamt', value: total, color: t.text },
            { label: 'Aktiv', value: tickets.filter(tk => tk.status !== 'abgeschlossen').length, color: SC.in_bearbeitung.color },
            { label: 'Dringend', value: dringend, color: dringend > 0 ? t.danger : t.success },
            { label: 'Überfällig', value: ueberfaellig, color: ueberfaellig > 0 ? t.danger : t.success },
          ].map(k => (
            <div key={k.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '14px' }}>
              <span style={{ fontFamily: t.fontMono, fontSize: 28, fontWeight: 600, color: k.color, display: 'block' }}>{k.value}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.fontSans }}>{k.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: t.fontSans, fontSize: 12, fontWeight: 600, color: t.textMuted, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nach Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {statuses.map(st => {
              const count = tickets.filter(tk => tk.status === st).length;
              return (
                <div key={st} style={{ borderRadius: 10, padding: '14px', background: SC[st].bg }}>
                  <span style={{ fontFamily: t.fontMono, fontSize: 24, fontWeight: 600, color: SC[st].color, display: 'block' }}>{count}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: SC[st].color, fontFamily: t.fontSans }}>{STATUS_LABELS[st]}</span>
                  {total > 0 && (
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, marginTop: 8 }}>
                      <div style={{ height: '100%', width: `${Math.round(count/total*100)}%`, background: SC[st].color, borderRadius: 2, minWidth: 4 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: t.fontSans, fontSize: 12, fontWeight: 600, color: t.textMuted, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nach Abteilung</h3>
          {abteilungen.length === 0 ? <p style={{ color: t.textLight, fontSize: 14, fontFamily: t.fontSans }}>Keine Daten</p> : (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 16px', background: t.surfaceAlt, borderBottom: `1px solid ${t.border}`, gap: 8 }}>
                {['Abteilung','Offen','Bearb.','Prüfung','Fertig','Ges.'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: t.fontSans, textAlign: h === 'Abteilung' ? 'left' : 'center' }}>{h}</span>
                ))}
              </div>
              {abteilungen.map(([abt, c]) => (
                <div key={abt} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: `1px solid ${t.borderLight}`, gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: t.text, fontFamily: t.fontSans }}>{abt}</span>
                  {statuses.map(st => (
                    <span key={st} style={{ fontSize: 14, textAlign: 'center', fontFamily: t.fontMono, color: c[st] > 0 ? SC[st].color : t.textLight, fontWeight: c[st] > 0 ? 600 : 400 }}>
                      {c[st] > 0 ? c[st] : '–'}
                    </span>
                  ))}
                  <span style={{ fontSize: 14, textAlign: 'center', fontFamily: t.fontMono, fontWeight: 600, color: t.text }}>{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
