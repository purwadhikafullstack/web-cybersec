const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'ecom_token';

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

// Deliberately stores the JWT in localStorage (not an httpOnly cookie) so
// it's readable by any script running on the page — including an injected
// stored-XSS payload (vuln #3). This is what makes session theft via XSS
// demonstrable in this app.
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  return fetch(`${API_URL}/api${path}`, { ...options, headers });
}

export { API_URL, apiFetch, getToken, setToken, clearToken, TOKEN_KEY };
