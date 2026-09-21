'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

// Note: the "Create Event" form below is shown only when the client thinks
// role === "admin" (matching PRD's "disembunyikan di UI" pattern) — the
// backend itself has no such check (vuln #4), so a direct API call from any
// logged-in customer works regardless of what this page renders.
export default function AdminPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  const [form, setForm] = useState({ title: '', description: '', event_date: '', price: '', capacity: '' });
  const [createResult, setCreateResult] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    const res = await apiFetch('/admin/sales');
    if (!res.ok) {
      setDashboardError('Akses ditolak — token kamu tidak diakui sebagai admin.');
      return;
    }
    setDashboard(await res.json());
  }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity),
      }),
    });
    const data = await res.json();
    setCreateResult(data);
    if (res.ok) {
      setForm({ title: '', description: '', event_date: '', price: '', capacity: '' });
    }
  }

  return (
    <div>
      <h1>Admin Panel</h1>

      {user?.role === 'admin' ? (
        <>
          <h2>Buat Event</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 420 }}>
            <input
              placeholder="Judul"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Deskripsi"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Harga"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Kuota kursi"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
            <button type="submit">Buat Event</button>
          </form>
          {createResult && (
            <pre style={{ background: '#f5f5f5', padding: '0.75rem', overflowX: 'auto' }}>
              {JSON.stringify(createResult, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <p>Kamu login sebagai &quot;{user?.role}&quot; — form buat event hanya tampil untuk admin.</p>
      )}

      <h2>Sales Dashboard</h2>
      {dashboardError && <p style={{ color: 'crimson' }}>{dashboardError}</p>}
      {dashboard && (
        <>
          <p>{dashboard.message}</p>
          {dashboard.flag && (
            <p>
              <strong>Flag:</strong> {dashboard.flag}
            </p>
          )}
          <p>
            Total tiket terjual: {dashboard.stats.ticket_count} — Revenue: Rp{' '}
            {Number(dashboard.stats.revenue).toLocaleString('id-ID')}
          </p>
          <ul>
            {dashboard.sales.map((s) => (
              <li key={s.id}>
                {s.ticket_code} — {s.event_title} — {s.buyer_email} — Rp {Number(s.price_paid).toLocaleString('id-ID')}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
