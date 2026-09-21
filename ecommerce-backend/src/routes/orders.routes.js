const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { listMyOrders, getOrder } = require('../controllers/orders.controller');

const router = Router();

router.get('/', requireAuth, listMyOrders);
router.get('/:id', requireAuth, getOrder);

module.exports = router;
