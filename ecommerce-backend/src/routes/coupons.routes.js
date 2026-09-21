const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { getCouponByCode } = require('../controllers/coupons.controller');

const router = Router();

router.get('/:code', requireAuth, getCouponByCode);

module.exports = router;
