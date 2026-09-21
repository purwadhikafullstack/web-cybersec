const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const TOKEN_KEY = 'ticket_token';

function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
}

function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// Stores the JWT in localStorage (not an httpOnly cookie) so it's readable
// by any script on the page — including an injected stored-XSS payload
// (vuln #6), and so a pentester can read/forge it from devtools (vuln #7).
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  return fetch(`${API_URL}/api${path}`, { ...options, headers });
}

// Decodes the JWT payload client-side with no signature check — purely for
// UI display (which nav links/forms to show). This intentionally mirrors
// what the backend itself trusts (see ticketing-backend's alg:none
// handling, vuln #7): if a forged token is pasted into localStorage, the UI
// reacts to it exactly like the API does, so testing via the browser and
// testing via curl/Burp show the same picture.
function decodeTokenPayload(token) {
  try {
    const [, payloadB64] = token.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export { API_URL, apiFetch, getToken, setToken, clearToken, decodeTokenPayload, TOKEN_KEY };
