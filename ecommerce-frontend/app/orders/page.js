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
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Pesanan Saya</h1>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">Belum ada pesanan.</div>
      ) : (
        <div className="list-card">
          {orders.map((o) => (
            <div key={o.id} className="list-row">
              <div className="main">
                <Link href={`/orders/${o.id}`}>Order #{o.id}</Link>
                <div className="meta">Rp {Number(o.total).toLocaleString('id-ID')}</div>
              </div>
              <span className={`status-pill is-${o.status}`}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
