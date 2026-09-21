const { Router } = require('express');

const { requireResetToken } = require('../middleware/requireResetToken');
const { resetTenant } = require('../controllers/admin-reset.controller');

const router = Router();

// POST /api/admin/reset/:tenant  (header: x-reset-token)
router.post('/reset/:tenant', requireResetToken, resetTenant);

module.exports = router;
