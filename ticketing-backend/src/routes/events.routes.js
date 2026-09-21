const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { listEvents, getEvent, createEvent, updateEvent } = require('../controllers/events.controller');
const { bookEvent } = require('../controllers/booking.controller');
const { bannerFromUrl } = require('../controllers/ssrf.controller');

const router = Router();

router.get('/', requireAuth, listEvents);
router.get('/:id', requireAuth, getEvent);
// Vuln #4: intentionally requireAuth only, no requireAdmin.
router.post('/', requireAuth, createEvent);
router.put('/:id', requireAuth, updateEvent);
router.post('/:id/book', requireAuth, bookEvent);
router.post('/:id/banner-from-url', requireAuth, bannerFromUrl);

module.exports = router;
