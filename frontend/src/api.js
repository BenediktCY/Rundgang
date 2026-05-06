const BASE = '/api';

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Anmeldung fehlgeschlagen');
  return res.json();
}

export async function getUsers() {
  return (await fetch(`${BASE}/users`)).json();
}

export async function createUser(data) {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE}/users/${id}`, { method: 'DELETE' });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function getStammdaten(typ) {
  return (await fetch(`${BASE}/stammdaten/${typ}`)).json();
}

export async function addStammdaten(typ, wert) {
  const res = await fetch(`${BASE}/stammdaten/${typ}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wert })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function deleteStammdaten(id) {
  await fetch(`${BASE}/stammdaten/${id}`, { method: 'DELETE' });
}

export async function getTickets() {
  return (await fetch(`${BASE}/tickets`)).json();
}

export async function getTicket(id) {
  return (await fetch(`${BASE}/tickets/${id}`)).json();
}

export async function createTicket(data) {
  const res = await fetch(`${BASE}/tickets`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Fehler beim Erstellen');
  return res.json();
}

export async function updateTicket(id, data) {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function deleteTicket(id, requesterId) {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requester_id: requesterId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Fehler'); }
  return res.json();
}

export async function addKommentar(ticketId, data) {
  const res = await fetch(`${BASE}/tickets/${ticketId}/kommentare`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Fehler');
  return res.json();
}
