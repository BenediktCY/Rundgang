import React, { useState } from 'react';
import Login from './components/Login';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import Einstellungen from './components/Einstellungen';
import { getTheme, getThemeKey } from './theme';

const V = { LIST: 'list', NEW: 'new', DETAIL: 'detail', ADMIN: 'admin', DASHBOARD: 'dashboard', EINSTELLUNGEN: 'einstellungen' };

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rundgang_user')); } catch { return null; }
  });
  const [view, setView] = useState(V.LIST);
  const [selectedId, setSelectedId] = useState(null);
  const [themeKey, setThemeKeyState] = useState(getThemeKey());

  const t = getTheme();

  function handleLogin(u) {
    localStorage.setItem('rundgang_user', JSON.stringify(u));
    setUser(u); setView(V.LIST);
  }
  function handleLogout() {
    localStorage.removeItem('rundgang_user');
    setUser(null);
  }
  function handleUserUpdate(updatedUser) {
    localStorage.setItem('rundgang_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }
  function handleThemeChange(key) {
    setThemeKeyState(key);
  }
  function selectTicket(id) { setSelectedId(id); setView(V.DETAIL); }

  if (!user) return <Login onLogin={handleLogin} theme={t} />;

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: t.fontSans }}>
      {/* Einstellungen-Button oben rechts */}
      <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 100 }}>
        <button style={{
          fontFamily: t.fontSans, fontSize: 13,
          padding: '6px 14px',
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 20, cursor: 'pointer',
          color: t.textMuted,
        }} onClick={() => setView(V.EINSTELLUNGEN)}>
          ⚙ {user.username}
        </button>
      </div>

      {view === V.LIST && (
        <TicketList user={user} theme={t} onSelect={selectTicket} onNew={() => setView(V.NEW)}
          onAdmin={() => setView(V.ADMIN)} onDashboard={() => setView(V.DASHBOARD)}
          onEinstellungen={() => setView(V.EINSTELLUNGEN)} />
      )}
      {view === V.NEW && (
        <TicketForm user={user} theme={t} onSave={() => setView(V.LIST)} onCancel={() => setView(V.LIST)} />
      )}
      {view === V.DETAIL && (
        <TicketDetail ticketId={selectedId} user={user} theme={t} onBack={() => setView(V.LIST)} />
      )}
      {view === V.ADMIN && user.role === 'pruefer' && (
        <AdminPanel theme={t} onBack={() => setView(V.LIST)} />
      )}
      {view === V.DASHBOARD && (
        <Dashboard theme={t} onBack={() => setView(V.LIST)} />
      )}
      {view === V.EINSTELLUNGEN && (
        <Einstellungen user={user} theme={t} onBack={() => setView(V.LIST)}
          onUserUpdate={handleUserUpdate} onLogout={handleLogout}
          onThemeChange={handleThemeChange} />
      )}
    </div>
  );
}
