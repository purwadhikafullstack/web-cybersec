const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { getPromoByCode } = require('../controllers/promos.controller');

const router = Router();

router.get('/:code', requireAuth, getPromoByCode);

module.exports = router;
