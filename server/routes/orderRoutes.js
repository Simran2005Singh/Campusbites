const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getFavorites,
  toggleFavorite,
  placeOrder,
  getOrders,
  getStaffOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All endpoints in this router are protected by JWT login check
router.use(protect);

// Student Cart API routes
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:id', updateCartQuantity);
router.delete('/cart/:id', removeFromCart);

// Student Favorites API routes
router.get('/favorites', getFavorites);
router.post('/favorites/toggle', toggleFavorite);

// Student Order Placement API routes
router.post('/place', placeOrder);
router.get('/history', getOrders);

// Canteen Staff & Admin Queue Processing routes
router.get('/staff', authorize('staff', 'admin'), getStaffOrders);
router.put('/:id/status', authorize('staff', 'admin'), updateOrderStatus);

module.exports = router;
