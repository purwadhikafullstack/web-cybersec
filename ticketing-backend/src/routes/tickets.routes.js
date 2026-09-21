const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { listMyTickets, getTicket } = require('../controllers/tickets.controller');

const router = Router();

router.get('/', requireAuth, listMyTickets);
router.get('/:id', requireAuth, getTicket);

module.exports = router;
