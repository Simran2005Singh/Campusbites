const db = require('../config/db');
const { orderQueue, loadActiveOrdersIntoQueue } = require('../services/orderQueue');

// ==========================================
// CART OPERATIONS
// ==========================================

// @desc    Get user's cart
// @route   GET /api/orders/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const [cartItems] = await db.query(
      `SELECT c.id, c.menu_item_id, c.quantity, m.name, m.price, m.image_url, (c.quantity * m.price) as subtotal
       FROM cart c
       JOIN menu_items m ON c.menu_item_id = m.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      cart: cartItems
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/orders/cart
// @access  Private
const addToCart = async (req, res, next) => {
  const { menu_item_id, quantity } = req.body;
  const qty = quantity ? parseInt(quantity) : 1;

  if (!menu_item_id) {
    res.status(400);
    return next(new Error('Menu item ID is required'));
  }

  try {
    // Check if item already exists in user's cart
    const [existing] = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND menu_item_id = ?',
      [req.user.id, menu_item_id]
    );

    if (existing.length > 0) {
      // Increment quantity
      const newQty = existing[0].quantity + qty;
      await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      // Insert new cart item
      await db.query(
        'INSERT INTO cart (user_id, menu_item_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, menu_item_id, qty]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Update quantity of cart item
// @route   PUT /api/orders/cart/:id
// @access  Private
const updateCartQuantity = async (req, res, next) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || parseInt(quantity) <= 0) {
    res.status(400);
    return next(new Error('Invalid quantity value'));
  }

  try {
    const [cartItem] = await db.query('SELECT id FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (cartItem.length === 0) {
      res.status(404);
      return next(new Error('Cart item not found'));
    }

    await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [parseInt(quantity), id]);

    res.status(200).json({
      success: true,
      message: 'Cart quantity updated'
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/orders/cart/:id
// @access  Private
const removeFromCart = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [cartItem] = await db.query('SELECT id FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (cartItem.length === 0) {
      res.status(404);
      return next(new Error('Cart item not found'));
    }

    await db.query('DELETE FROM cart WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// ==========================================
// FAVORITES OPERATIONS
// ==========================================

// @desc    Get user's favorites
// @route   GET /api/orders/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const [favorites] = await db.query(
      `SELECT f.id as fav_id, m.*, c.name as category_name
       FROM favorites f
       JOIN menu_items m ON f.menu_item_id = m.id
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE f.user_id = ?`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      favorites
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Toggle favorite item
// @route   POST /api/orders/favorites/toggle
// @access  Private
const toggleFavorite = async (req, res, next) => {
  const { menu_item_id } = req.body;

  if (!menu_item_id) {
    res.status(400);
    return next(new Error('Menu item ID is required'));
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND menu_item_id = ?',
      [req.user.id, menu_item_id]
    );

    if (existing.length > 0) {
      // Remove favorite
      await db.query('DELETE FROM favorites WHERE id = ?', [existing[0].id]);
      res.status(200).json({
        success: true,
        isFavorite: false,
        message: 'Item removed from favorites'
      });
    } else {
      // Add favorite
      await db.query('INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?)', [req.user.id, menu_item_id]);
      res.status(200).json({
        success: true,
        isFavorite: true,
        message: 'Item added to favorites'
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// ==========================================
// ORDER OPERATIONS
// ==========================================

// @desc    Place order from cart (Transactional checkout)
// @route   POST /api/orders/place
// @access  Private
const placeOrder = async (req, res, next) => {
  // Acquire a dedicated database connection to ensure transaction locking works safely
  const connection = await db.getConnection();

  try {
    // 1. Fetch user's cart items
    const [cartItems] = await connection.query(
      `SELECT c.menu_item_id, c.quantity, m.name, m.price
       FROM cart c
       JOIN menu_items m ON c.menu_item_id = m.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      connection.release();
      res.status(400);
      return next(new Error('Your cart is empty. Cannot place an order.'));
    }

    // 2. Start MySQL transaction block
    await connection.beginTransaction();

    // 3. Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // 4. Create master Order record
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, 'pending']
    );

    const orderId = orderResult.insertId;

    // 5. Copy cart items to order_items detail table
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }

    // 6. Clear user's cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    // 7. Commit database changes
    await connection.commit();
    connection.release();

    // 8. Rebuild/refresh active Kitchen Queue in memory (FIFO)
    await loadActiveOrdersIntoQueue();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId
    });

  } catch (error) {
    // Rollback changes if anything crashes
    await connection.rollback();
    connection.release();
    res.status(500);
    next(error);
  }
};

// @desc    Get user's order history
// @route   GET /api/orders/history
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT id, total_amount, status, created_at 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Fetch items details for each order to present a detailed UI list
    const detailedOrders = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, m.name
         FROM order_items oi
         LEFT JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      detailedOrders.push({
        ...order,
        items
      });
    }

    res.status(200).json({
      success: true,
      orders: detailedOrders
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get all active kitchen orders in FIFO sequence
// @route   GET /api/orders/staff
// @access  Private (Staff/Admin only)
const getStaffOrders = async (req, res, next) => {
  try {
    // Return the array representation of the manual Queue
    const activeOrders = orderQueue.getElements();
    res.status(200).json({
      success: true,
      orders: activeOrders
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff/Admin only)
const updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    return next(new Error('Invalid order status value'));
  }

  try {
    const [orders] = await db.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    // Update status in database
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Re-sync memory Queue to align status changes
    await loadActiveOrdersIntoQueue();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = {
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
};
