const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function apiFetch(path, options = {}) {
  return fetch(`${API_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
}

export { API_URL };
