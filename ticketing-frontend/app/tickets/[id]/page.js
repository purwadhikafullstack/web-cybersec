'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/tickets/${id}`);
      const data = await res.json();
      if (res.ok) setTicket(data.ticket);
      else setError(data.error || 'Ticket not found');
    })();
  }, [id]);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!ticket) return <p>Loading...</p>;

  return (
    <div>
      <h1>Tiket #{ticket.id}</h1>
      <p>Event: {ticket.event_title}</p>
      <p>
        Kode tiket: <strong>{ticket.ticket_code}</strong>
      </p>
      <p>Harga dibayar: Rp {Number(ticket.price_paid).toLocaleString('id-ID')}</p>
      {ticket.note && <p>Catatan: {ticket.note}</p>}
    </div>
  );
}
