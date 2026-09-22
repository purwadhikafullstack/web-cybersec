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

  if (loading) return <p className="loading-state">Loading...</p>;

  if (!user) {
    return (
      <section className="hero">
        <div className="container">
          <span className="eyebrow">⚡ Dumverse Store</span>
          <h1>Belanja gadget favoritmu, langsung dari katalog Dumverse</h1>
          <p>
            Ini adalah aplikasi e-commerce tiruan untuk latihan keamanan siber. Silakan{' '}
            login atau daftar untuk melihat katalog produk.
          </p>
          <div className="hero-cta">
            <Link href="/login" className="btn btn--indigo">Login</Link>
            <Link href="/register" className="btn btn--pill-ghost-onDark">
              Daftar Akun
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Katalog Produk</h1>
        <p>Temukan produk terbaik di Dumverse Store.</p>
      </div>

      <form onSubmit={handleSearch} className="search" style={{ maxWidth: 480, marginBottom: 'var(--s6)' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk..." />
        <button type="submit" aria-label="Cari">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        </button>
      </form>
      <button type="button" className="btn btn--ghost btn--sm" onClick={loadProducts} style={{ marginBottom: 'var(--s6)' }}>
        Reset Pencarian
      </button>

      {error && <p className="alert alert--error">{error}</p>}

      {products.length === 0 ? (
        <div className="empty-state">Tidak ada produk ditemukan.</div>
      ) : (
        <div className="products">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="product-card">
              <div className="img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.name} />
              </div>
              <span className={`stock${p.stock > 0 ? '' : ' is-out'}`}>
                <span className="dot" />
                {p.stock > 0 ? `Stok ${p.stock}` : 'Habis'}
              </span>
              <div className="name">{p.name}</div>
              <div className="price">Rp {Number(p.price).toLocaleString('id-ID')}</div>
              <span className="btn">Lihat Detail</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
