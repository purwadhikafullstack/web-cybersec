const { Router } = require('express');

const { receiveLog } = require('../controllers/log.controller');

const router = Router();

router.use('/admin', require('./admin-reset.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/events', require('./events.routes'));
router.use('/tickets', require('./tickets.routes'));
router.use('/promos', require('./promos.routes'));
router.use('/_internal', require('./internal.routes'));
router.post('/_log', receiveLog);

module.exports = router;
