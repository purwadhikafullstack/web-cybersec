const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { checkout } = require('../controllers/checkout.controller');

const router = Router();

router.post('/', requireAuth, checkout);

module.exports = router;
