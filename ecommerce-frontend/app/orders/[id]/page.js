'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/orders/${id}`);
      const data = await res.json();
      if (res.ok) setOrder(data.order);
      else setError(data.error || 'Order not found');
    })();
  }, [id]);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h1>Order #{order.id}</h1>
      <p>Status: {order.status}</p>
      <p>Total: Rp {Number(order.total).toLocaleString('id-ID')}</p>
      {order.note && <p>Catatan: {order.note}</p>}
      <ul>
        {order.items.map((it) => (
          <li key={it.id}>
            {it.product_name} x{it.quantity} — Rp {Number(it.unit_price).toLocaleString('id-ID')}
          </li>
        ))}
      </ul>
    </div>
  );
}
