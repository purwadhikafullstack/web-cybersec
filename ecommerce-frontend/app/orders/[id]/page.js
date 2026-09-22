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

  if (error) return <p className="alert alert--error">{error}</p>;
  if (!order) return <p className="loading-state">Loading...</p>;

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Order #{order.id}</h1>
        <p>
          <span className={`status-pill is-${order.status}`}>{order.status}</span>
          {'  '}Total: Rp {Number(order.total).toLocaleString('id-ID')}
        </p>
        {order.note && <p>Catatan: {order.note}</p>}
      </div>

      <div className="list-card">
        {order.items.map((it) => (
          <div key={it.id} className="list-row">
            <div className="main">
              <span className="name">{it.product_name} × {it.quantity}</span>
            </div>
            <span className="price">Rp {Number(it.unit_price).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
