'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, updateQuantity, removeFromCart } from '../../lib/cart';

export default function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function handleQtyChange(productId, qty) {
    setCart(updateQuantity(productId, Number(qty)));
  }

  function handleRemove(productId) {
    setCart(removeFromCart(productId));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Keranjang</h1>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          Keranjang kosong. <Link href="/">Belanja sekarang</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <div key={item.productId} className="cart-row">
                <span className="name">{item.name}</span>
                <span className="price">Rp {item.price.toLocaleString('id-ID')}</span>
                <div className="qty">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                  />
                </div>
                <button type="button" className="remove" onClick={() => handleRemove(item.productId)} aria-label="Hapus">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h3>Ringkasan</h3>
            <div className="summary-line is-total">
              <span>Total</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <Link href="/checkout" className="btn btn--indigo">Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
