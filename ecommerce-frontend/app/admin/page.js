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

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!dashboard) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>{dashboard.message}</p>
      {dashboard.flag && (
        <p>
          <strong>Flag:</strong> {dashboard.flag}
        </p>
      )}
      <p>
        Users: {dashboard.stats.userCount} — Orders: {dashboard.stats.orderCount} — Revenue: Rp{' '}
        {Number(dashboard.stats.revenue).toLocaleString('id-ID')}
      </p>

      <h2>Kupon</h2>
      <ul>
        {dashboard.coupons.map((c) => (
          <li key={c.code}>
            {c.code} — {c.discount_percent}% — {c.note}
          </li>
        ))}
      </ul>

      <h2>Kelola Produk</h2>
      <form onSubmit={handleCreateProduct} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          placeholder="Nama"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          required
        />
        <input
          placeholder="Harga"
          type="number"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          required
        />
        <input
          placeholder="Stok"
          type="number"
          value={newProduct.stock}
          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
        />
        <input
          placeholder="Deskripsi"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
        <button type="submit">Tambah Produk</button>
      </form>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — Rp {Number(p.price).toLocaleString('id-ID')} (stok {p.stock})
          </li>
        ))}
      </ul>

      <h2>Semua Order (tenant ini)</h2>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            #{o.id} — {o.user_email} — Rp {Number(o.total).toLocaleString('id-ID')}
          </li>
        ))}
      </ul>
    </div>
  );
}
