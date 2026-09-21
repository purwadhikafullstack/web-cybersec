'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { getCart, clearCart } from '../../lib/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const rawTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleApplyCoupon() {
    setError('');
    setCouponPreview(null);
    if (!couponCode) return;
    const res = await apiFetch(`/coupons/${encodeURIComponent(couponCode)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Kupon tidak ditemukan');
      return;
    }
    setCouponPreview(data.coupon);
  }

  async function handleCheckout() {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          ...(couponPreview ? { couponCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Checkout gagal');
        return;
      }
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return <p>Keranjang kosong.</p>;
  }

  return (
    <div>
      <h1>Checkout</h1>
      {cart.map((item) => (
        <div key={item.productId}>
          {item.name} x{item.quantity} — Rp {(item.price * item.quantity).toLocaleString('id-ID')}
        </div>
      ))}
      <p>Subtotal: Rp {rawTotal.toLocaleString('id-ID')}</p>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input placeholder="Kode kupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
        <button type="button" onClick={handleApplyCoupon}>
          Terapkan
        </button>
      </div>
      {couponPreview && (
        <p>
          Kupon &quot;{couponPreview.code}&quot; diterapkan: diskon {couponPreview.discount_percent}%
        </p>
      )}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button type="button" onClick={handleCheckout} disabled={submitting}>
        {submitting ? 'Memproses...' : 'Bayar sekarang'}
      </button>
    </div>
  );
}
