const db = require('../config/db');
const menuTrie = require('../services/menuTrie');
const menuUndoStack = require('../services/undoStack');
const MaxHeap = require('../utils/MaxHeap');
const HashMap = require('../utils/HashMap');

// Utility helper to fetch full details of a single menu item
const getFullItemDetails = async (id) => {
  const [rows] = await db.query(
    `SELECT m.*, c.name as category_name 
     FROM menu_items m 
     LEFT JOIN categories c ON m.category_id = c.id 
     WHERE m.id = ?`,
    [id]
  );
  return rows[0];
};

// @desc    Add a menu item
// @route   POST /api/admin/menu
// @access  Private (Admin only)
const addMenuItem = async (req, res, next) => {
  const { name, description, price, category_id, image_url, is_available } = req.body;

  if (!name || price === undefined) {
    res.status(400);
    return next(new Error('Name and price are required'));
  }

  try {
    const isAvail = is_available !== undefined ? is_available : true;
    const [result] = await db.query(
      `INSERT INTO menu_items (name, description, price, category_id, image_url, is_available) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || '', parseFloat(price), category_id || null, image_url || '', isAvail]
    );

    const insertedId = result.insertId;
    const newItem = await getFullItemDetails(insertedId);

    // 1. Insert into Trie Search Index
    menuTrie.insert(newItem.name, newItem);

    // 2. Push action to global Undo Stack
    menuUndoStack.push({
      type: 'ADD',
      item: newItem
    });

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      menuItem: newItem
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/admin/menu/:id
// @access  Private (Admin only)
const updateMenuItem = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, price, category_id, image_url, is_available } = req.body;

  try {
    const oldItem = await getFullItemDetails(id);
    if (!oldItem) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }

    const isAvail = is_available !== undefined ? is_available : oldItem.is_available;

    await db.query(
      `UPDATE menu_items 
       SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, is_available = ? 
       WHERE id = ?`,
      [
        name || oldItem.name,
        description !== undefined ? description : oldItem.description,
        price !== undefined ? parseFloat(price) : oldItem.price,
        category_id !== undefined ? category_id : oldItem.category_id,
        image_url !== undefined ? image_url : oldItem.image_url,
        isAvail,
        id
      ]
    );

    const updatedItem = await getFullItemDetails(id);

    // Update Trie index (Remove old name, Insert new name)
    menuTrie.remove(oldItem.name, parseInt(id));
    menuTrie.insert(updatedItem.name, updatedItem);

    // Push action to Undo Stack
    menuUndoStack.push({
      type: 'EDIT',
      oldItem: oldItem,
      newItem: updatedItem
    });

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      menuItem: updatedItem
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/admin/menu/:id
// @access  Private (Admin only)
const deleteMenuItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const itemToDelete = await getFullItemDetails(id);
    if (!itemToDelete) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }

    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);

    // Remove from Trie search index
    menuTrie.remove(itemToDelete.name, parseInt(id));

    // Push action to Undo Stack
    menuUndoStack.push({
      type: 'DELETE',
      item: itemToDelete
    });

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Undo the last menu update action (LIFO Reversion)
// @route   POST /api/admin/menu/undo
// @access  Private (Admin only)
const undoLastMenuUpdate = async (req, res, next) => {
  if (menuUndoStack.isEmpty()) {
    res.status(400);
    return next(new Error('No actions left on the stack to undo!'));
  }

  // Pop action from manual Stack
  const action = menuUndoStack.pop();

  try {
    if (action.type === 'ADD') {
      // Revert ADD -> Delete inserted item
      await db.query('DELETE FROM menu_items WHERE id = ?', [action.item.id]);
      menuTrie.remove(action.item.name, action.item.id);
      
      res.status(200).json({
        success: true,
        message: `Successfully undone ADD: Removed "${action.item.name}"`
      });
    } 
    else if (action.type === 'DELETE') {
      // Revert DELETE -> Insert deleted item back with original ID
      await db.query(
        `INSERT INTO menu_items (id, name, description, price, category_id, image_url, is_available) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          action.item.id,
          action.item.name,
          action.item.description,
          action.item.price,
          action.item.category_id,
          action.item.image_url,
          action.item.is_available
        ]
      );
      
      const restoredItem = await getFullItemDetails(action.item.id);
      menuTrie.insert(restoredItem.name, restoredItem);

      res.status(200).json({
        success: true,
        message: `Successfully undone DELETE: Restored "${action.item.name}"`
      });
    } 
    else if (action.type === 'EDIT') {
      // Revert EDIT -> Update item back to old values
      await db.query(
        `UPDATE menu_items 
         SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, is_available = ? 
         WHERE id = ?`,
        [
          action.oldItem.name,
          action.oldItem.description,
          action.oldItem.price,
          action.oldItem.category_id,
          action.oldItem.image_url,
          action.oldItem.is_available,
          action.oldItem.id
        ]
      );

      // Revert Trie mappings
      menuTrie.remove(action.newItem.name, action.newItem.id);
      
      const revertedItem = await getFullItemDetails(action.oldItem.id);
      menuTrie.insert(revertedItem.name, revertedItem);

      res.status(200).json({
        success: true,
        message: `Successfully undone EDIT: Reverted "${action.newItem.name}" changes`
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get dashboard metrics & analytics charts data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Fetch KPI metrics (Total sales, total orders, active students, categories)
    const [revenueRow] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");
    const [ordersRow] = await db.query("SELECT COUNT(*) as total FROM orders");
    const [usersRow] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'student'");
    const [categoriesRow] = await db.query("SELECT COUNT(*) as total FROM categories");

    const totalSales = revenueRow[0].total || 0;
    const totalOrders = ordersRow[0].total || 0;
    const studentCount = usersRow[0].total || 0;
    const categoryCount = categoriesRow[0].total || 0;

    // 2. Fetch daily sales trend (past 7 days)
    const [trendRows] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%b %d') as date, SUM(total_amount) as revenue, COUNT(*) as orders
       FROM orders
       WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    // 3. Category distribution (Performance-optimized using custom HashMap)
    const [categoriesList] = await db.query('SELECT id, name FROM categories');
    const categoryMap = new HashMap();
    
    // Load categories into HashMap for O(1) resolver speed
    for (const cat of categoriesList) {
      categoryMap.put(cat.id, cat.name);
    }

    // Query quantities ordered per category ID
    const [salesDistribution] = await db.query(
      `SELECT mi.category_id, SUM(oi.quantity) as quantity
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       GROUP BY mi.category_id`
    );

    const categoryDistribution = {};
    for (const dist of salesDistribution) {
      // Resolve category ID -> Name in O(1) from HashMap cache
      const catName = categoryMap.get(dist.category_id) || 'Uncategorized';
      categoryDistribution[catName] = parseInt(dist.quantity) || 0;
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalSales,
        totalOrders,
        studentCount,
        categoryCount
      },
      dailyTrend: trendRows,
      categoryDistribution
    });

  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get top-selling menu items using custom Max Heap
// @route   GET /api/admin/popular
// @access  Private (Admin only)
const getPopularItems = async (req, res, next) => {
  try {
    // Query total sold quantity per menu item
    const [salesRows] = await db.query(
      `SELECT oi.menu_item_id, m.name, SUM(oi.quantity) as sales_count
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       GROUP BY oi.menu_item_id, m.name`
    );

    // Create custom Max Heap
    const heap = new MaxHeap();
    for (const row of salesRows) {
      heap.insert({
        id: row.menu_item_id,
        name: row.name,
        sales_count: parseInt(row.sales_count) || 0
      });
    }

    // Extract top 5 items from the Max Heap
    const popularItems = [];
    while (heap.size() > 0 && popularItems.length < 5) {
      popularItems.push(heap.extractMax());
    }

    res.status(200).json({
      success: true,
      popularItems
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  undoLastMenuUpdate,
  getDashboardAnalytics,
  getPopularItems
};
