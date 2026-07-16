import api from './api';

const orderService = {
  // Student Cart APIs
  getCart: async () => {
    const response = await api.get('/orders/cart');
    return response.data;
  },

  addToCart: async (menuItemId, quantity = 1) => {
    const response = await api.post('/orders/cart', { menu_item_id: menuItemId, quantity });
    return response.data;
  },

  updateCartQuantity: async (cartId, quantity) => {
    const response = await api.put(`/orders/cart/${cartId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (cartId) => {
    const response = await api.delete(`/orders/cart/${cartId}`);
    return response.data;
  },

  // Student Favorites APIs
  getFavorites: async () => {
    const response = await api.get('/orders/favorites');
    return response.data;
  },

  toggleFavorite: async (menuItemId) => {
    const response = await api.post('/orders/favorites/toggle', { menu_item_id: menuItemId });
    return response.data;
  },

  // Student Checkout APIs
  placeOrder: async () => {
    const response = await api.post('/orders/place');
    return response.data;
  },

  getOrderHistory: async () => {
    const response = await api.get('/orders/history');
    return response.data;
  },

  // Kitchen/Staff Queue APIs
  getStaffOrders: async () => {
    const response = await api.get('/orders/staff');
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }
};

export default orderService;
