const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { salesDashboard } = require('../controllers/admin.controller');

const router = Router();

router.get('/sales', requireAuth, requireAdmin, salesDashboard);

module.exports = router;
