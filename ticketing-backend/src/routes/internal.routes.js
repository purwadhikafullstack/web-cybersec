const { Router } = require('express');

const { internalMetadata } = require('../controllers/internal.controller');

const router = Router();

// No auth middleware here on purpose — this is meant to simulate an
// internal-only service, gated by the header secret inside the controller
// itself, not by user login.
router.get('/metadata', internalMetadata);

module.exports = router;
