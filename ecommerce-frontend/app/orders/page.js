'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/orders');
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    })();
  }, []);

  return (
    <div>
      <h1>Pesanan Saya</h1>
      {orders.map((o) => (
        <div key={o.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
          <Link href={`/orders/${o.id}`}>Order #{o.id}</Link> — Rp {Number(o.total).toLocaleString('id-ID')} — {o.status}
        </div>
      ))}
      {orders.length === 0 && <p>Belum ada pesanan.</p>}
    </div>
  );
}
