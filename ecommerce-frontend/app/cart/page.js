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
      <h1>Keranjang</h1>
      {cart.length === 0 && (
        <p>
          Keranjang kosong. <Link href="/">Belanja sekarang</Link>
        </p>
      )}
      {cart.map((item) => (
        <div
          key={item.productId}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #eee', padding: '0.5rem 0' }}
        >
          <span style={{ flex: 1 }}>{item.name}</span>
          <span>Rp {item.price.toLocaleString('id-ID')}</span>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleQtyChange(item.productId, e.target.value)}
            style={{ width: 60 }}
          />
          <button type="button" onClick={() => handleRemove(item.productId)}>
            Hapus
          </button>
        </div>
      ))}
      {cart.length > 0 && (
        <>
          <p>
            <strong>Total: Rp {total.toLocaleString('id-ID')}</strong>
          </p>
          <Link href="/checkout">
            <button type="button">Checkout</button>
          </Link>
        </>
      )}
    </div>
  );
}
