const { pool } = require('../config/db');

const EVENT_COLUMNS = 'id, title, description, event_date, price, capacity, seats_booked, banner_url, created_at';

async function listEvents(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${EVENT_COLUMNS} FROM events WHERE tenant = $1 ORDER BY event_date`,
      [req.user.tenant]
    );
    res.json({ events: rows });
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT ${EVENT_COLUMNS} FROM events WHERE id = $1 AND tenant = $2`,
      [id, req.user.tenant]
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

// VULN #4 (Broken Access Control): no role check at all — any authenticated
// user, not just admins, can create an event via a direct API call. The
// frontend only hides the "Create Event" UI for non-admins.
async function createEvent(req, res, next) {
  try {
    const { title, description, event_date, price, capacity, banner_url } = req.body || {};
    if (!title || !event_date || price === undefined || capacity === undefined) {
      return res.status(400).json({ error: 'title, event_date, price, and capacity are required' });
    }

    const { rows: [event] } = await pool.query(
      `INSERT INTO events (tenant, title, description, event_date, price, capacity, seats_booked, banner_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
       RETURNING ${EVENT_COLUMNS}`,
      [req.user.tenant, title, description || null, event_date, price, capacity, banner_url || null, req.user.id]
    );

    const { rows: flagRows } = await pool.query(
      `SELECT value FROM flags WHERE tenant = $1 AND vuln_key = 'bac_event_create'`,
      [req.user.tenant]
    );

    res.status(201).json({ event, flag: flagRows[0] && flagRows[0].value });
  } catch (err) {
    next(err);
  }
}

// Also has no role check — same vuln #4, just via the edit path instead of
// create.
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, event_date, price, capacity, banner_url } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
    if (event_date !== undefined) { fields.push(`event_date = $${i++}`); values.push(event_date); }
    if (price !== undefined) { fields.push(`price = $${i++}`); values.push(price); }
    if (capacity !== undefined) { fields.push(`capacity = $${i++}`); values.push(capacity); }
    if (banner_url !== undefined) { fields.push(`banner_url = $${i++}`); values.push(banner_url); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.user.tenant);
    const idPlaceholder = i++;
    const tenantPlaceholder = i;
    const { rows } = await pool.query(
      `UPDATE events SET ${fields.join(', ')}
       WHERE id = $${idPlaceholder} AND tenant = $${tenantPlaceholder}
       RETURNING ${EVENT_COLUMNS}`,
      values
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent };
