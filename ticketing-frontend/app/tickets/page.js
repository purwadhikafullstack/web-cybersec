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
      <h1>My Tickets</h1>
      {tickets.map((t) => (
        <div key={t.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
          <Link href={`/tickets/${t.id}`}>
            {t.event_title} — {t.ticket_code}
          </Link>{' '}
          — Rp {Number(t.price_paid).toLocaleString('id-ID')}
        </div>
      ))}
      {tickets.length === 0 && <p>Belum ada tiket.</p>}
    </div>
  );
}
