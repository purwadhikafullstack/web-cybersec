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

  if (loading) return <p className="loading-state">Loading...</p>;

  if (!user) {
    return (
      <section className="hero">
        <div className="container">
          <span className="eyebrow">🎟️ Eventra Tickets</span>
          <h1>Temukan dan pesan tiket event favoritmu</h1>
          <p>
            Ini adalah aplikasi event ticketing tiruan untuk latihan keamanan siber. Silakan{' '}
            login atau daftar untuk melihat daftar event.
          </p>
          <div className="hero-cta">
            <Link href="/login" className="btn btn--indigo">Login</Link>
            <Link href="/register" className="btn btn--pill-ghost-onDark">Daftar Akun</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="page-head" style={{ margin: '0 0 var(--s7)' }}>
        <h1>Daftar Event</h1>
        <p>Pilih event dan amankan kursimu sebelum kehabisan.</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">Belum ada event tersedia.</div>
      ) : (
        <div className="products">
          {events.map((e) => {
            const seatsLeft = e.capacity - e.seats_booked;
            const soldOut = seatsLeft <= 0;
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="product-card">
                <div className="img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.banner_url} alt={e.title} />
                  {soldOut && <span className="badge badge--sale">Sold out</span>}
                </div>
                <span className={`stock${soldOut ? ' is-out' : ''}`}>
                  <span className="dot" />
                  {soldOut ? 'Sold out' : `${seatsLeft} kursi tersisa`} (kuota {e.capacity})
                </span>
                <div className="name">{e.title}</div>
                <div className="meta-row" style={{ marginBottom: 4 }}>
                  {new Date(e.event_date).toLocaleDateString('id-ID')}
                </div>
                <div className="price">Rp {Number(e.price).toLocaleString('id-ID')}</div>
                <span className="btn">Lihat Detail</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
