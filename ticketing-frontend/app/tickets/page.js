'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/tickets');
      const data = await res.json();
      if (res.ok) setTickets(data.tickets);
    })();
  }, []);

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>My Tickets</h1>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">Belum ada tiket.</div>
      ) : (
        <div className="list-card">
          {tickets.map((t) => (
            <div key={t.id} className="list-row">
              <div className="main">
                <Link href={`/tickets/${t.id}`}>{t.event_title} — {t.ticket_code}</Link>
              </div>
              <span className="price">Rp {Number(t.price_paid).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
