export const THEMES = {
  standard: {
    name: 'Standard',
    description: 'Hell, minimalistisch',
    bg: '#f5f5f3',
    surface: '#ffffff',
    surfaceAlt: '#fafaf8',
    border: '#e8e8e3',
    borderLight: '#f0f0ec',
    text: '#1a1a18',
    textMuted: '#888888',
    textLight: '#aaaaaa',
    accent: '#1a1a18',
    accentText: '#ffffff',
    danger: '#c0392b',
    dangerBg: '#fdecea',
    success: '#27ae60',
    fontMono: "'IBM Plex Mono', monospace",
    fontSans: "'IBM Plex Sans', sans-serif",
  },
  dunkel: {
    name: 'Dunkel',
    description: 'Dunkler Hintergrund',
    bg: '#111111',
    surface: '#1e1e1e',
    surfaceAlt: '#252525',
    border: '#333333',
    borderLight: '#2a2a2a',
    text: '#e8e8e3',
    textMuted: '#888888',
    textLight: '#555555',
    accent: '#4a9eff',
    accentText: '#ffffff',
    danger: '#e74c3c',
    dangerBg: '#2d1515',
    success: '#2ecc71',
    fontMono: "'IBM Plex Mono', monospace",
    fontSans: "'IBM Plex Sans', sans-serif",
  },
  industrie: {
    name: 'Industrie',
    description: 'Kontraststark, orange',
    bg: '#1a1a1a',
    surface: '#242424',
    surfaceAlt: '#2e2e2e',
    border: '#3a3a3a',
    borderLight: '#303030',
    text: '#f0f0f0',
    textMuted: '#999999',
    textLight: '#666666',
    accent: '#e67e22',
    accentText: '#ffffff',
    danger: '#e74c3c',
    dangerBg: '#2d1515',
    success: '#27ae60',
    fontMono: "'IBM Plex Mono', monospace",
    fontSans: "'IBM Plex Sans', sans-serif",
  }
};

export function getTheme() {
  const saved = localStorage.getItem('rundgang_theme');
  return THEMES[saved] || THEMES.standard;
}

export function getThemeKey() {
  return localStorage.getItem('rundgang_theme') || 'standard';
}

export function setThemeKey(key) {
  localStorage.setItem('rundgang_theme', key);
}
