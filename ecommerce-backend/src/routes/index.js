const { Router } = require('express');

const { receiveLog } = require('../controllers/log.controller');

const router = Router();

router.use('/admin', require('./admin-reset.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/products', require('./products.routes'));
router.use('/checkout', require('./checkout.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/coupons', require('./coupons.routes'));
router.post('/_log', receiveLog);

module.exports = router;
