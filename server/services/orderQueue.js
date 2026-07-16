const Queue = require('../utils/Queue');
const db = require('../config/db');

// Instantiate global active orders FIFO queue
const orderQueue = new Queue();

/**
   * Restores active orders from MySQL database on boot to maintain FIFO state.
   */
async function loadActiveOrdersIntoQueue() {
  try {
    orderQueue.clear();

    // Query active orders sorted by creation date (oldest first -> FIFO order)
    const [orders] = await db.query(
      `SELECT o.*, u.name as customer_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.status IN ('pending', 'preparing', 'ready_for_pickup') 
       ORDER BY o.created_at ASC`
    );

    for (const order of orders) {
      // Gather ordered menu items detail string
      const [items] = await db.query(
        `SELECT oi.*, m.name as item_name 
         FROM order_items oi 
         LEFT JOIN menu_items m ON oi.menu_item_id = m.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );

      const itemsDescription = items.map(i => `${i.quantity}x ${i.item_name || 'Deleted Item'}`).join(', ');

      orderQueue.enqueue({
        id: order.id,
        user_id: order.user_id,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        status: order.status,
        items: itemsDescription,
        created_at: order.created_at
      });
    }

    console.log(`✅ Restored ${orderQueue.size()} active orders from DB into FIFO Kitchen Queue!`);
  } catch (error) {
    console.warn('⚠️ Kitchen Queue boot loader skipped (Database connection might not be initialized yet).');
  }
}

module.exports = {
  orderQueue,
  loadActiveOrdersIntoQueue
};
