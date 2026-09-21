'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { addToCart } from '../../../lib/cart';
import { useAuth } from '../../../lib/auth-context';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) load();
  }, [user, id]);

  async function load() {
    const res = await apiFetch(`/products/${id}`);
    const data = await res.json();
    if (res.ok) {
      setProduct(data.product);
      setReviews(data.reviews);
    } else {
      setError(data.error || 'Product not found');
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    const res = await apiFetch(`/products/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: Number(rating), body }),
    });
    const data = await res.json();
    if (res.ok) {
      setBody('');
      load();
    } else {
      setError(data.error || 'Failed to submit review');
    }
  }

  function handleAddToCart() {
    addToCart(product, Number(qty));
    router.push('/cart');
  }

  if (loading || !user) return <p>Silakan login untuk melihat produk.</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt={product.name} style={{ maxWidth: 320 }} />
      <p>{product.description}</p>
      <p>
        Rp {Number(product.price).toLocaleString('id-ID')} — stok {product.stock}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 60 }} />
        <button type="button" onClick={handleAddToCart}>
          Tambah ke keranjang
        </button>
      </div>

      <h2>Tulis Review</h2>
      <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480 }}>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} bintang
            </option>
          ))}
        </select>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tulis review..." required />
        <button type="submit">Kirim review</button>
      </form>

      <h2>Review</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map((r) => (
          <li key={r.id} style={{ borderTop: '1px solid #eee', padding: '0.5rem 0' }}>
            <strong>{r.author_name}</strong> — {r.rating} bintang
            {/*
              Vuln #3 (Stored XSS): review body is rendered as raw HTML with
              no sanitization, mirroring the backend which stores it verbatim.
            */}
            <div dangerouslySetInnerHTML={{ __html: r.body }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
