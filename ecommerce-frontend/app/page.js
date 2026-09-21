'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadProducts();
  }, [user]);

  async function loadProducts() {
    const res = await apiFetch('/products');
    const data = await res.json();
    if (res.ok) setProducts(data.products);
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    const res = await apiFetch(`/products/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Search failed');
      return;
    }
    setProducts(data.products);
  }

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div>
        <h1>E-commerce (Dummy)</h1>
        <p>
          Silakan <Link href="/login">login</Link> atau <Link href="/register">daftar</Link> untuk melihat katalog.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Katalog Produk</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk..." />
        <button type="submit">Cari</button>
        <button type="button" onClick={loadProducts}>
          Reset
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            style={{ border: '1px solid #ddd', padding: '1rem', textDecoration: 'none', color: 'inherit' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            <h3>{p.name}</h3>
            <p>Rp {Number(p.price).toLocaleString('id-ID')}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
