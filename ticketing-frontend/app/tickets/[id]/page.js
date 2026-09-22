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

  if (error) return <p className="alert alert--error">{error}</p>;
  if (!ticket) return <p className="loading-state">Loading...</p>;

  return (
    <div className="form-card" style={{ maxWidth: 480 }}>
      <h1>Tiket #{ticket.id}</h1>
      <p className="sub">{ticket.event_title}</p>

      <div className="summary-line">
        <span>Kode tiket</span>
        <strong>{ticket.ticket_code}</strong>
      </div>
      <div className="summary-line is-total">
        <span>Harga dibayar</span>
        <span>Rp {Number(ticket.price_paid).toLocaleString('id-ID')}</span>
      </div>
      {ticket.note && <p className="alert alert--info">Catatan: {ticket.note}</p>}
    </div>
  );
}
