import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import orderService from '../services/orderService';
import { FiLogOut, FiSun, FiMoon, FiCheckCircle, FiPlay, FiCoffee, FiAlertCircle } from 'react-icons/fi';

function StaffDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State Management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch orders from backend FIFO queue
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getStaffOrders();
      if (response.success) {
        setOrders(response.orders);
      }
    } catch (err) {
      console.error('Failed to load staff orders:', err);
      setError('Could not retrieve orders from kitchen queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status trigger
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        showToast(`Order #CB-${orderId} advanced to "${newStatus}"!`);
        // Refresh queue
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg bg-indigo-650 text-white font-semibold text-sm transition-all flex items-center space-x-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent font-display">CampusBites</span>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full uppercase">Staff Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition">
              {isDarkMode ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <div className="text-sm font-medium hidden md:block text-slate-700 dark:text-slate-300 font-display">
              Kitchen Desk: {user?.name || 'Staff User'}
            </div>
            <button onClick={handleLogout} className="flex items-center space-x-1 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition">
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Order Queue</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Orders are processed in a FIFO pipeline (First-In, First-Out).</p>
          </div>
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center space-x-1">
            <FiAlertCircle className="w-3.5 h-3.5" />
            <span>{orders.length} orders active</span>
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900/50 rounded-xl mb-6">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading queue pipeline...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-400">
            No active orders in kitchen queue. Relax!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, idx) => (
              <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">Order #CB-{order.id}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                      order.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                      order.status === 'preparing' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' :
                      'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                    }`}>
                      {order.status === 'ready_for_pickup' ? 'Ready' : order.status}
                    </span>
                  </div>

                  <div className="my-5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Customer</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-350">{order.customer_name || 'Student'}</p>
                    
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-4 mb-1">Ordered Items</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{order.items}</p>
                  </div>

                  {/* Queue position index */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-400 text-xs px-3 py-1.5 rounded-lg flex justify-between items-center mb-4">
                    <span>Queue Position:</span>
                    <span className="font-bold"># {idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition"
                      >
                        <FiPlay className="w-3.5 h-3.5" />
                        <span>Start Preparing</span>
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition"
                      >
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}
                    {order.status === 'ready_for_pickup' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-750 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition"
                      >
                        <FiCoffee className="w-3.5 h-3.5" />
                        <span>Serve & Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default StaffDashboard;
