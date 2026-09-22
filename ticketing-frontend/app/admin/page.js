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
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Admin Panel</h1>
      </div>

      {user?.role === 'admin' ? (
        <div className="detail-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <h2>Buat Event</h2>
          <form onSubmit={handleCreate} className="form-card" style={{ margin: 0 }}>
            <div className="field">
              <label>Judul</label>
              <input
                placeholder="Judul"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Deskripsi</label>
              <textarea
                placeholder="Deskripsi"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Tanggal & Waktu</label>
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Harga</label>
                <input
                  type="number"
                  placeholder="Harga"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Kuota kursi</label>
                <input
                  type="number"
                  placeholder="Kuota kursi"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn--indigo btn--block">Buat Event</button>
          </form>
          {createResult && (
            <pre className="result-box">{JSON.stringify(createResult, null, 2)}</pre>
          )}
        </div>
      ) : (
        <p className="alert alert--info">
          Kamu login sebagai &quot;{user?.role}&quot; — form buat event hanya tampil untuk admin.
        </p>
      )}

      <div className="detail-section">
        <h2>Sales Dashboard</h2>
        {dashboardError && <p className="alert alert--error">{dashboardError}</p>}
        {dashboard && (
          <>
            <p style={{ marginBottom: 'var(--s4)', color: 'var(--fg-soft)' }}>{dashboard.message}</p>
            {dashboard.flag && (
              <div className="flag-banner">
                <strong>Flag:</strong> {dashboard.flag}
              </div>
            )}
            <div className="stat-row">
              <div className="stat-tile">
                <div className="label">Tiket Terjual</div>
                <div className="value">{dashboard.stats.ticket_count}</div>
              </div>
              <div className="stat-tile">
                <div className="label">Revenue</div>
                <div className="value">Rp {Number(dashboard.stats.revenue).toLocaleString('id-ID')}</div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode Tiket</th>
                    <th>Event</th>
                    <th>Pembeli</th>
                    <th>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.sales.map((s) => (
                    <tr key={s.id}>
                      <td className="strong">{s.ticket_code}</td>
                      <td>{s.event_title}</td>
                      <td>{s.buyer_email}</td>
                      <td>Rp {Number(s.price_paid).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
