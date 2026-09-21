const { Router } = require('express');

const { requireAuth } = require('../middleware/requireAuth');
const { listProducts, getProduct, searchProducts } = require('../controllers/products.controller');
const { createReview } = require('../controllers/reviews.controller');

const router = Router();

// /search must be registered before /:id or Express would treat "search"
// as a product id.
router.get('/search', requireAuth, searchProducts);
router.get('/', requireAuth, listProducts);
router.get('/:id', requireAuth, getProduct);
router.post('/:id/reviews', requireAuth, createReview);

module.exports = router;
