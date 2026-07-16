import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import menuService from '../services/menuService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { FiLogOut, FiSun, FiMoon, FiTrash2, FiRotateCcw, FiPlus, FiGrid, FiTrendingUp, FiDollarSign, FiUsers, FiShoppingBag, FiStar } from 'react-icons/fi';

// Register ChartJS Components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State Management
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Analytics states
  const [metrics, setMetrics] = useState({ totalSales: 0, totalOrders: 0, studentCount: 0, categoryCount: 0 });
  const [dailyTrend, setDailyTrend] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState({});
  const [popularItems, setPopularItems] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Fetch categories, menu items, and analytics on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, menuRes, analyticsRes, popularRes] = await Promise.all([
        menuService.getCategories(),
        menuService.getMenuItems(),
        menuService.getAnalytics(),
        menuService.getPopularItems()
      ]);
      
      if (catRes.success) setCategories(catRes.categories);
      if (menuRes.success) setMenuItems(menuRes.menuItems);
      
      if (analyticsRes.success) {
        setMetrics(analyticsRes.metrics);
        setDailyTrend(analyticsRes.dailyTrend);
        setCategoryDistribution(analyticsRes.categoryDistribution);
      }

      if (popularRes.success) {
        setPopularItems(popularRes.popularItems);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError('Failed to fetch menu or analytics charts from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set default category when categories list loads
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // 2. Add MenuItem handler (Pushes to Trie & Stack on Server)
  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      setError('Please provide a name, price, and category.');
      return;
    }
    setError('');
    setMessage('');

    try {
      const response = await menuService.addMenuItem({
        name,
        price: parseFloat(price),
        category_id: parseInt(categoryId),
        description: description || 'Freshly made canteen specialty.'
      });

      if (response.success) {
        setMessage(`Added "${name}" and pushed action to Undo Stack.`);
        setName('');
        setPrice('');
        setDescription('');
        // Reload menu and popular lists
        await loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu item.');
    }
  };

  // 3. Delete MenuItem handler (Pushes to Stack on Server)
  const handleDeleteFood = async (itemId, itemName) => {
    setError('');
    setMessage('');
    try {
      const response = await menuService.deleteMenuItem(itemId);
      if (response.success) {
        setMessage(`Deleted "${itemName}" and pushed action to Undo Stack.`);
        // Reload menu and popular lists
        await loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete menu item.');
    }
  };

  // 4. Undo handler (Pops from Stack on Server and Reverts database)
  const handleUndo = async () => {
    setError('');
    setMessage('');
    try {
      const response = await menuService.undoLastAction();
      if (response.success) {
        setMessage(response.message || 'Successfully reverted the last action!');
        // Reload menu and popular lists
        await loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Undo failed. The action stack might be empty.');
    }
  };

  // Chart Data Configurations (Dynamic fallback if empty)
  const chartLabels = dailyTrend.length > 0 ? dailyTrend.map(t => t.date) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartRevenue = dailyTrend.length > 0 ? dailyTrend.map(t => parseFloat(t.revenue)) : [0, 0, 0, 0, 0, 0, 0];

  const revenueData = {
    labels: chartLabels,
    datasets: [{
      label: 'Daily Revenue (₹)',
      data: chartRevenue,
      borderColor: '#4f71db',
      backgroundColor: 'rgba(79, 113, 219, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const distLabels = Object.keys(categoryDistribution).length > 0 ? Object.keys(categoryDistribution) : ['No Sales'];
  const distData = Object.values(categoryDistribution).length > 0 ? Object.values(categoryDistribution) : [1];

  const categoryDistributionData = {
    labels: distLabels,
    datasets: [{
      data: distData,
      backgroundColor: ['#6d8ef0', '#3855c8', '#2c42a5', '#9cb5f7', '#a78bfa', '#cbd5e1'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDarkMode ? '#94a3b8' : '#64748b' }
      }
    },
    scales: {
      y: {
        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
      },
      x: {
        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent font-display">CampusBites</span>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full uppercase">Admin Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition">
              {isDarkMode ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <div className="text-sm font-medium hidden md:block text-slate-700 dark:text-slate-300">
              Root: {user?.name || 'Administrator'}
            </div>
            <button onClick={handleLogout} className="flex items-center space-x-1 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition">
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Alerts Feedback */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-655 border border-red-200 dark:border-red-900/50 rounded-xl text-sm">{error}</div>
        )}
        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-655 border border-green-200 dark:border-green-900/50 rounded-xl text-sm">{message}</div>
        )}

        {/* Metric Cards (Hydrated from Live DB Aggregates) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-lg"><FiDollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">₹{parseFloat(metrics.totalSales).toFixed(2)}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg"><FiShoppingBag className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{metrics.totalOrders}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg"><FiUsers className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Count</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{metrics.studentCount}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg"><FiGrid className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{metrics.categoryCount}</h4>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Revenue Trend</h3>
            <div className="h-64 relative">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Category Distribution</h3>
            <div className="h-64 relative flex items-center justify-center">
              <Doughnut 
                data={categoryDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: isDarkMode ? '#94a3b8' : '#64748b' } } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Max Heap Popular Items Table & Stack Menu Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Food Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <FiPlus className="text-primary-500" />
                  <span>Add Menu Item</span>
                </h3>
                <button 
                  onClick={handleUndo} 
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg border bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400 transition"
                  title="Pops last action from LIFO Stack"
                >
                  <FiRotateCcw className="w-3 h-3" />
                  <span>Undo Last</span>
                </button>
              </div>

              <form onSubmit={handleAddFood} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Food Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="E.g., Spring Rolls"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      placeholder="90"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={categoryId} 
                      onChange={e => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  Create and Push to Stack
                </button>
              </form>
            </div>

            {/* Popular Items list (Manual Max Heap results) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-1.5">
                <FiStar className="text-amber-500 fill-amber-500" />
                <span>Top Selling Foods</span>
              </h3>
              
              {popularItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">No orders completed yet.</p>
              ) : (
                <div className="space-y-2">
                  {popularItems.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-800 border-l-4 border-primary-500">
                      <div>
                        <span className="font-extrabold text-primary-600 dark:text-primary-400 mr-2">#{index + 1}</span>
                        <span className="text-slate-850 dark:text-slate-300 font-semibold">{item.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold rounded-full text-slate-655 dark:text-slate-300">
                        {item.sales_count} sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-1.5">
                <FiGrid className="text-primary-500" />
                <span>Menu Administration</span>
              </h3>
              
              {loading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading menus...</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <th className="py-2.5">Name</th>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5 text-right">Price</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 font-medium text-slate-850 dark:text-slate-300">{item.name}</td>
                          <td className="py-3 text-slate-500 dark:text-slate-450">{item.category_name || 'Uncategorized'}</td>
                          <td className="py-3 text-right font-bold text-slate-850 dark:text-slate-300">₹{parseFloat(item.price).toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleDeleteFood(item.id, item.name)} 
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-450 hover:text-red-600 rounded transition"
                              title="Delete Item & Push to Stack"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;
