'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [booking, setBooking] = useState(false);

  const [bannerUrl, setBannerUrl] = useState('');
  const [fetchResult, setFetchResult] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user, id]);

  async function load() {
    const res = await apiFetch(`/events/${id}`);
    const data = await res.json();
    if (res.ok) setEvent(data.event);
    else setError(data.error || 'Event not found');
  }

  async function handleBook(e) {
    e.preventDefault();
    setBooking(true);
    setBookingResult(null);
    try {
      const res = await apiFetch(`/events/${id}/book`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: Number(quantity),
          price: event.price,
          ...(promoCode ? { promoCode } : {}),
        }),
      });
      const data = await res.json();
      setBookingResult(data);
      if (res.ok) load();
    } finally {
      setBooking(false);
    }
  }

  async function handleBannerFromUrl(e) {
    e.preventDefault();
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await apiFetch(`/events/${id}/banner-from-url`, {
        method: 'POST',
        body: JSON.stringify({ url: bannerUrl }),
      });
      const data = await res.json();
      setFetchResult(data.fetch || data);
      if (res.ok) load();
    } finally {
      setFetching(false);
    }
  }

  if (loading || !user) return <p>Silakan login untuk melihat event.</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!event) return <p>Loading...</p>;

  const seatsLeft = event.capacity - event.seats_booked;

  return (
    <div>
      <h1>{event.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.banner_url} alt={event.title} style={{ maxWidth: 480 }} />

      {/*
        Vuln #6 (Stored XSS): description is rendered as raw HTML with no
        sanitization, mirroring the backend which stores it verbatim.
      */}
      <div dangerouslySetInnerHTML={{ __html: event.description }} />

      <p>Tanggal: {new Date(event.event_date).toLocaleString('id-ID')}</p>
      <p>Harga: Rp {Number(event.price).toLocaleString('id-ID')}</p>
      <p>
        Kursi: {seatsLeft} / {event.capacity} tersisa ({event.seats_booked} terpesan)
      </p>

      <h2>Pesan Tiket</h2>
      <form onSubmit={handleBook} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Jumlah:{' '}
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: 60 }} />
        </label>
        <label>
          Kode promo:{' '}
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="opsional" />
        </label>
        <button type="submit" disabled={booking}>
          {booking ? 'Memproses...' : 'Pesan'}
        </button>
      </form>
      {bookingResult && (
        <pre style={{ background: '#f5f5f5', padding: '0.75rem', overflowX: 'auto' }}>
          {JSON.stringify(bookingResult, null, 2)}
        </pre>
      )}

      <h2>Set Banner dari URL</h2>
      <form onSubmit={handleBannerFromUrl} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://..."
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={fetching}>
          {fetching ? 'Fetching...' : 'Set Banner'}
        </button>
      </form>
      {fetchResult && (
        <pre style={{ background: '#f5f5f5', padding: '0.75rem', overflowX: 'auto' }}>
          {JSON.stringify(fetchResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
