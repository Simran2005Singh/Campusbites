const express = require('express');
const router = express.Router();
const { addMenuItem, updateMenuItem, deleteMenuItem, undoLastMenuUpdate, getDashboardAnalytics, getPopularItems } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Lock down all routes in this file to logged in Admins only
router.use(protect);
router.use(authorize('admin'));

// Menu management endpoints
router.post('/menu', addMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);
router.post('/menu/undo', undoLastMenuUpdate);

// Dashboard analytics & Max Heap endpoints
router.get('/analytics', getDashboardAnalytics);
router.get('/popular', getPopularItems);

module.exports = router;
