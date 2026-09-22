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

  if (loading || !user) return <p className="loading-state">Silakan login untuk melihat produk.</p>;
  if (error) return <p className="alert alert--error">{error}</p>;
  if (!product) return <p className="loading-state">Loading...</p>;

  return (
    <div>
      <div className="detail-layout">
        <div className="detail-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_url} alt={product.name} />
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          <p className="desc">{product.description}</p>
          <div className="price-row">
            <span className="now">Rp {Number(product.price).toLocaleString('id-ID')}</span>
            <span className="status-pill">stok {product.stock}</span>
          </div>
          <div className="detail-cta">
            <div className="qty">
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <button type="button" className="btn btn--indigo" onClick={handleAddToCart}>
              Tambah ke keranjang
            </button>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h2>Tulis Review</h2>
        <form onSubmit={submitReview} className="form-card" style={{ margin: 0, maxWidth: 480 }}>
          <div className="field">
            <label>Rating</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} bintang
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Review</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tulis review..." required />
          </div>
          <button type="submit" className="btn btn--indigo">Kirim review</button>
        </form>
      </div>

      <div className="detail-section">
        <h2>Review</h2>
        <div className="review-list">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-head">
                <span className="author">{r.author_name}</span>
                <span className="stars">{r.rating} ★</span>
              </div>
              {/*
                Vuln #3 (Stored XSS): review body is rendered as raw HTML with
                no sanitization, mirroring the backend which stores it verbatim.
              */}
              <div className="body" dangerouslySetInnerHTML={{ __html: r.body }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
