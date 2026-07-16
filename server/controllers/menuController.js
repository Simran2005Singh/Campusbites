const db = require('../config/db');
const menuTrie = require('../services/menuTrie');

// @desc    Get all categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get all menu items (optionally filtered by category)
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res, next) => {
  const { category_id } = req.query;

  try {
    let query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id
    `;
    const params = [];

    if (category_id) {
      query += ' WHERE m.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY m.name ASC';

    const [menuItems] = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      menuItems
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Search menu items using custom Trie autocomplete
// @route   GET /api/menu/search
// @access  Public
const searchMenu = async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return res.status(200).json({
      success: true,
      results: []
    });
  }

  try {
    // Query our in-memory custom Trie search index
    const results = menuTrie.search(q);
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = {
  getCategories,
  getMenuItems,
  searchMenu
};
