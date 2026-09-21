const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  listAllProducts,
  createProduct,
  updateProduct,
  listAllOrders,
  dashboard,
} = require('../controllers/admin.controller');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);
router.get('/products', listAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.get('/orders', listAllOrders);

module.exports = router;
