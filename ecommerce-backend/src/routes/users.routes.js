const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { getMe, updateMe, listUsers } = require('../controllers/users.controller');

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
// Vuln #7: intentionally requireAuth only, no requireAdmin.
router.get('/', requireAuth, listUsers);

module.exports = router;
