import api from './api';

const menuService = {
  // Public Menu Endpoints
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  getMenuItems: async (categoryId) => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/menu', { params });
    return response.data;
  },

  searchMenu: async (query) => {
    const response = await api.get('/menu/search', { params: { q: query } });
    return response.data;
  },

  // Protected Admin Menu Endpoints
  addMenuItem: async (itemData) => {
    const response = await api.post('/admin/menu', itemData);
    return response.data;
  },

  updateMenuItem: async (id, itemData) => {
    const response = await api.put(`/admin/menu/${id}`, itemData);
    return response.data;
  },

  deleteMenuItem: async (id) => {
    const response = await api.delete(`/admin/menu/${id}`);
    return response.data;
  },

  undoLastAction: async () => {
    const response = await api.post('/admin/menu/undo');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getPopularItems: async () => {
    const response = await api.get('/admin/popular');
    return response.data;
  }
};

export default menuService;
