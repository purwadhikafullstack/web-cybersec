'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', image_url: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError('');
    const dRes = await apiFetch('/admin/dashboard');
    if (!dRes.ok) {
      setError('Akses ditolak — akun kamu bukan admin.');
      return;
    }
    setDashboard(await dRes.json());

    const [pRes, oRes] = await Promise.all([apiFetch('/admin/products'), apiFetch('/admin/orders')]);
    if (pRes.ok) setProducts((await pRes.json()).products);
    if (oRes.ok) setOrders((await oRes.json()).orders);
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    const res = await apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
      }),
    });
    if (res.ok) {
      setNewProduct({ name: '', price: '', stock: '', description: '', image_url: '' });
      load();
    }
  }

  if (error) return <p className="alert alert--error">{error}</p>;
  if (!dashboard) return <p className="loading-state">Loading...</p>;

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s6)' }}>
        <h1>Admin Panel</h1>
        <p>{dashboard.message}</p>
      </div>

      {dashboard.flag && (
        <div className="flag-banner">
          <strong>Flag:</strong> {dashboard.flag}
        </div>
      )}

      <div className="stat-row">
        <div className="stat-tile">
          <div className="label">Users</div>
          <div className="value">{dashboard.stats.userCount}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Orders</div>
          <div className="value">{dashboard.stats.orderCount}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Revenue</div>
          <div className="value">Rp {Number(dashboard.stats.revenue).toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="detail-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        <h2>Kupon</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Diskon</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.coupons.map((c) => (
                <tr key={c.code}>
                  <td className="strong">{c.code}</td>
                  <td>{c.discount_percent}%</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="detail-section">
        <h2>Kelola Produk</h2>
        <form onSubmit={handleCreateProduct} className="inline-form" style={{ marginBottom: 'var(--s6)' }}>
          <div className="field">
            <label>Nama</label>
            <input
              placeholder="Nama"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Harga</label>
            <input
              placeholder="Harga"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Stok</label>
            <input
              placeholder="Stok"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Deskripsi</label>
            <input
              placeholder="Deskripsi"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn--indigo">Tambah Produk</button>
        </form>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Harga</th>
                <th>Stok</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.name}</td>
                  <td>Rp {Number(p.price).toLocaleString('id-ID')}</td>
                  <td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="detail-section">
        <h2>Semua Order (tenant ini)</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="strong">#{o.id}</td>
                  <td>{o.user_email}</td>
                  <td>Rp {Number(o.total).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
