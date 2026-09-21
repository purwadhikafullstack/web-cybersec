'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (user) loadEvents();
  }, [user]);

  async function loadEvents() {
    const res = await apiFetch('/events');
    const data = await res.json();
    if (res.ok) setEvents(data.events);
  }

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div>
        <h1>Event Ticketing (Dummy)</h1>
        <p>
          Silakan <Link href="/login">login</Link> atau <Link href="/register">daftar</Link> untuk melihat daftar event.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Daftar Event</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {events.map((e) => {
          const seatsLeft = e.capacity - e.seats_booked;
          return (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              style={{ border: '1px solid #ddd', padding: '1rem', textDecoration: 'none', color: 'inherit' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.banner_url} alt={e.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
              <h3>{e.title}</h3>
              <p>{new Date(e.event_date).toLocaleDateString('id-ID')}</p>
              <p>Rp {Number(e.price).toLocaleString('id-ID')}</p>
              <p>
                {seatsLeft > 0 ? `${seatsLeft} kursi tersisa` : 'Sold out'} (kuota {e.capacity})
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
