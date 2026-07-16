const express = require('express');
const router = express.Router();
const { getCategories, getMenuItems, searchMenu } = require('../controllers/menuController');

// Public routes for fetching menus and categories
router.get('/categories', getCategories);
router.get('/', getMenuItems);
router.get('/search', searchMenu);

module.exports = router;
