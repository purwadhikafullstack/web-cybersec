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

  if (loading || !user) return <p className="loading-state">Silakan login untuk melihat event.</p>;
  if (error) return <p className="alert alert--error">{error}</p>;
  if (!event) return <p className="loading-state">Loading...</p>;

  const seatsLeft = event.capacity - event.seats_booked;

  return (
    <div>
      <div className="detail-layout">
        <div className="detail-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.banner_url} alt={event.title} />
        </div>
        <div className="detail-info">
          <h1>{event.title}</h1>

          {/*
            Vuln #6 (Stored XSS): description is rendered as raw HTML with no
            sanitization, mirroring the backend which stores it verbatim.
          */}
          <div className="desc" dangerouslySetInnerHTML={{ __html: event.description }} />

          <div className="meta-row">
            <span><strong>Tanggal:</strong> {new Date(event.event_date).toLocaleString('id-ID')}</span>
          </div>

          <div className="price-row">
            <span className="now">Rp {Number(event.price).toLocaleString('id-ID')}</span>
            <span className={`status-pill${seatsLeft <= 0 ? ' is-cancelled' : ' is-paid'}`}>
              {seatsLeft} / {event.capacity} kursi tersisa
            </span>
          </div>

          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s3)' }}>Pesan Tiket</h2>
          <form onSubmit={handleBook} className="inline-form">
            <div className="field">
              <label>Jumlah</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="field">
              <label>Kode promo</label>
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="opsional" />
            </div>
            <button type="submit" className="btn btn--indigo" disabled={booking}>
              {booking ? 'Memproses...' : 'Pesan'}
            </button>
          </form>
          {bookingResult && (
            <pre className="result-box">{JSON.stringify(bookingResult, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h2>Set Banner dari URL</h2>
        <form onSubmit={handleBannerFromUrl} className="inline-form">
          <div className="field" style={{ flex: 2 }}>
            <label>URL Banner</label>
            <input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <button type="submit" className="btn btn--ghost" disabled={fetching}>
            {fetching ? 'Fetching...' : 'Set Banner'}
          </button>
        </form>
        {fetchResult && (
          <pre className="result-box">{JSON.stringify(fetchResult, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
