const crypto = require('crypto');

const { pool } = require('../config/db');

function randomTicketCode() {
  return `TKT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// VULN #2 (Race Condition / overselling): capacity is checked, then updated
// in a SEPARATE query after an artificial delay — no transaction, no
// locking. Concurrent requests can each pass the check before any of them
// commits the update, allowing more bookings than the event's capacity.
//
// VULN #3 (Business Logic Flaw): `price` is trusted from the client instead
// of recomputed from the event's real price, and `quantity` isn't validated
// to be positive — either lets the total go to zero or negative.
async function bookEvent(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const { quantity, price, promoCode } = req.body || {};

    if (quantity === undefined || price === undefined) {
      return res.status(400).json({ error: 'quantity and price are required' });
    }

    const { rows: eventRows } = await pool.query(
      `SELECT id, capacity, seats_booked FROM events WHERE id = $1 AND tenant = $2`,
      [eventId, req.user.tenant]
    );
    const event = eventRows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const qty = Number(quantity);
    const unitPrice = Number(price);

    if (qty > 0 && event.seats_booked + qty > event.capacity) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Artificial delay widens the TOCTOU race window so overselling is
    // reliably reproducible with a handful of parallel requests (curl
    // parallel / Burp Intruder), not precise nanosecond timing.
    await sleep(300);

    let appliedPromo = null;
    let discountPercent = 0;
    if (promoCode) {
      const { rows: promoRows } = await pool.query(
        `SELECT code, discount_percent FROM promos WHERE tenant = $1 AND code = $2`,
        [req.user.tenant, promoCode]
      );
      if (promoRows[0]) {
        appliedPromo = promoRows[0];
        discountPercent = promoRows[0].discount_percent;
      }
    }

    const { rows: [updated] } = await pool.query(
      `UPDATE events SET seats_booked = seats_booked + $1 WHERE id = $2 RETURNING seats_booked, capacity`,
      [qty, eventId]
    );

    const ticketPrice = Math.round(unitPrice * (1 - discountPercent / 100) * 100) / 100;
    const seatCount = Math.min(1000, Math.max(0, Math.trunc(qty)));
    const tickets = [];
    for (let i = 0; i < seatCount; i++) {
      const { rows: [ticket] } = await pool.query(
        `INSERT INTO tickets (event_id, user_id, ticket_code, price_paid)
         VALUES ($1, $2, $3, $4)
         RETURNING id, ticket_code, price_paid, created_at`,
        [eventId, req.user.id, randomTicketCode(), ticketPrice]
      );
      tickets.push(ticket);
    }

    const total = Math.round(ticketPrice * qty * 100) / 100;

    const flags = {};
    if (updated.seats_booked > updated.capacity) {
      const { rows: flagRows } = await pool.query(
        `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'race_condition'`,
        [req.user.tenant]
      );
      if (flagRows[0]) flags.raceCondition = flagRows[0].value;
    }
    if (total <= 0) {
      const { rows: flagRows } = await pool.query(
        `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'price_tamper'`,
        [req.user.tenant]
      );
      if (flagRows[0]) flags.priceTamper = flagRows[0].value;
    }

    res.status(201).json({
      tickets,
      total,
      seatsBooked: updated.seats_booked,
      capacity: updated.capacity,
      ...(appliedPromo ? { appliedPromo } : {}),
      ...(Object.keys(flags).length ? { flags } : {}),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { bookEvent };
