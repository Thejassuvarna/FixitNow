const { AVATAR_GRADIENTS } = require('./constants');

/** ₹1,299 – Indian digit grouping */
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Normalises a mobile number to an exact 10-digit string.
 * Returns null when the number is not a valid 10-digit mobile.
 */
function normalizePhone(input) {
  if (!input) return null;
  let d = String(input).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (!/^[0-9]{10}$/.test(d)) return null;
  return d;
}

/** 10-digit phone -> "919876543210" (for wa.me links) */
const phoneDigits = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return `91${d}`;
  return d;
};

/** 10-digit phone -> "tel:+919876543210" (for tel: links) */
const telHref = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return `tel:+91${d}`;
  return `tel:+${d}`;
};

const whatsappHref = (phone, text) =>
  `https://wa.me/${phoneDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || 'LF';

const avatarGradient = (name = '') => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const steps = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [label, s] of steps) {
    const v = Math.floor(secs / s);
    if (v >= 1) return `${v} ${label}${v > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Star rating HTML: grey ★★★★★ with an amber overlay clipped to the rating %.
 * @param {number} rating 0-5
 * @param {string} size   Tailwind text-size class
 */
function renderStars(rating = 0, size = 'text-base') {
  const pct = Math.max(0, Math.min(100, (Number(rating) / 5) * 100));
  return `<span class="relative inline-block leading-none whitespace-nowrap ${size}" role="img" aria-label="${Number(rating).toFixed(1)} out of 5 stars">` +
    `<span class="text-ink-200">★★★★★</span>` +
    `<span class="absolute left-0 top-0 overflow-hidden text-amber-400" style="width:${pct}%">★★★★★</span></span>`;
}

/** Only allow same-site relative redirects */
const safeRedirect = (url, fallback = '/') =>
  typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : fallback;

/* Inline SVG icons (outline, 24x24 viewBox) */
const ICON_PATHS = {
  search: 'M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z',
  pin: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.14-7.5 11.25-7.5 11.25S4.5 17.64 4.5 10.5a7.5 7.5 0 1115 0z',
  phone: 'M2.25 6.75c0 8.28 6.72 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.37a1.13 1.13 0 00-.85-1.09l-4.42-1.1a1.13 1.13 0 00-1.17.42l-.97 1.29a1.04 1.04 0 01-1.36.28 12.04 12.04 0 01-5.52-5.52 1.04 1.04 0 01.28-1.36l1.29-.97a1.13 1.13 0 00.42-1.17l-1.1-4.42a1.13 1.13 0 00-1.09-.85H5.25A2.25 2.25 0 003 4.5v2.25z',
  check: 'M4.5 12.75l6 6 9-13.5',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75A11.96 11.96 0 0112 2.71z',
  clock: 'M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z',
  briefcase: 'M20.25 14.15v4.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-4.25m16.5 0a2.25 2.25 0 00.75-1.66V8.7a2.25 2.25 0 00-2.25-2.25h-3.75m5.25 7.7a24.3 24.3 0 01-16.5 0m0 0A2.25 2.25 0 013 12.49V8.7a2.25 2.25 0 012.25-2.25H9m6 0V5.25A2.25 2.25 0 0012.75 3h-1.5A2.25 2.25 0 009 5.25v1.2m6 0H9',
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  x: 'M6 18L18 6M6 6l12 12',
  arrow: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.59-7.5-1.65z',
  logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
  trash: 'M14.74 9l-.35 9m-4.78 0L9.26 9m9.97-3.21c.34.05.68.11 1.02.17m-1.02-.17L18.16 19.67a2.25 2.25 0 01-2.24 2.08H8.08a2.25 2.25 0 01-2.24-2.08L4.77 5.79m14.46 0a48.1 48.1 0 00-3.48-.4m-12 .57c.34-.06.68-.12 1.02-.17m0 0a48.1 48.1 0 013.48-.4m7.5 0v-.92c0-1.18-.91-2.16-2.09-2.2a51.96 51.96 0 00-3.32 0c-1.18.04-2.09 1.02-2.09 2.2v.92m7.5 0a48.67 48.67 0 00-7.5 0',
  camera: 'M6.83 7.07A2.25 2.25 0 018.7 6h6.6a2.25 2.25 0 011.87 1.07l.66 1A2.25 2.25 0 0019.7 9.1H20.25A2.25 2.25 0 0122.5 11.35v7.4A2.25 2.25 0 0120.25 21H3.75a2.25 2.25 0 01-2.25-2.25v-7.4A2.25 2.25 0 013.75 9.1h.55a2.25 2.25 0 001.87-1.03l.66-1zM16.5 13.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z',
  sliders: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  sparkle: 'M9.81 15.9L9 18.75l-.81-2.85a4.5 4.5 0 00-3.09-3.09L2.25 12l2.85-.81a4.5 4.5 0 003.09-3.09L9 5.25l.81 2.85a4.5 4.5 0 003.09 3.09L15.75 12l-2.85.81a4.5 4.5 0 00-3.09 3.09zM18.26 8.72L18 9.75l-.26-1.03a3.38 3.38 0 00-2.46-2.46L14.25 6l1.04-.26a3.38 3.38 0 002.46-2.46L18 2.25l.26 1.03a3.38 3.38 0 002.46 2.46l1.03.26-1.03.26a3.38 3.38 0 00-2.46 2.46z',
  chart: 'M3 13.125C3 12.5 3.5 12 4.125 12h2.25c.62 0 1.125.5 1.125 1.125v6.75C7.5 20.5 7 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.62.5-1.125 1.125-1.125h2.25c.62 0 1.125.5 1.125 1.125v11.25c0 .62-.5 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.62.5-1.125 1.125-1.125h2.25C20.5 3 21 3.5 21 4.125v15.75c0 .62-.5 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
};

/** icon('search', 'h-5 w-5') -> <svg …> */
function icon(name, cls = 'h-5 w-5', stroke = 2) {
  if (name === 'whatsapp') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.4z"/></svg>`;
  }
  if (name === 'starFill') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11a.56.56 0 00.47.35l5.52.44c.5.04.7.67.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.29 5.38a.56.56 0 01-.84.61l-4.73-2.89a.56.56 0 00-.59 0l-4.73 2.89a.56.56 0 01-.84-.61l1.29-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.35L11.48 3.5z"/></svg>`;
  }
  const d = ICON_PATHS[name] || '';
  return `<svg class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

module.exports = {
  formatINR, normalizePhone, phoneDigits, telHref, whatsappHref, initials,
  avatarGradient, escapeRegex, timeAgo, formatDate, renderStars, safeRedirect, icon,
};
