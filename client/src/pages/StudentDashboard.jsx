import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import menuService from '../services/menuService';
import orderService from '../services/orderService';
import { FiLogOut, FiSun, FiMoon, FiSearch, FiShoppingCart, FiHeart, FiTrendingUp, FiClock, FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State Management
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart & Favorites States
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const suggestionsRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showNotification = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Fetch initial datasets
  const fetchCartData = async () => {
    try {
      const response = await orderService.getCart();
      if (response.success) setCart(response.cart);
    } catch (err) {
      console.error('Cart load failed:', err);
    }
  };

  const fetchFavoritesData = async () => {
    try {
      const response = await orderService.getFavorites();
      if (response.success) setFavorites(response.favorites);
    } catch (err) {
      console.error('Favorites load failed:', err);
    }
  };

  const fetchActiveOrdersData = async () => {
    try {
      const response = await orderService.getOrderHistory();
      if (response.success) {
        // Filter active order statuses: pending, preparing, ready_for_pickup
        const active = response.orders.filter(o => 
          ['pending', 'preparing', 'ready_for_pickup'].includes(o.status)
        );
        setActiveOrders(active);
      }
    } catch (err) {
      console.error('Orders load failed:', err);
    }
  };

  // On mount load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catRes, menuRes] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems()
        ]);
        if (catRes.success) setCategories([{ id: null, name: 'All' }, ...catRes.categories]);
        if (menuRes.success) setMenuItems(menuRes.menuItems);
        
        await Promise.all([
          fetchCartData(),
          fetchFavoritesData(),
          fetchActiveOrdersData()
        ]);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch initial canteen parameters.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch menu when category changes
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const response = await menuService.getMenuItems(selectedCategory);
        if (response.success) setMenuItems(response.menuItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (categories.length > 0) {
      fetchMenu();
    }
  }, [selectedCategory]);

  // Autocomplete search listener
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        try {
          const response = await menuService.searchMenu(searchQuery);
          if (response.success) {
            setSuggestions(response.results);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle Cart updates
  const handleAddToCart = async (itemId, itemName) => {
    try {
      const response = await orderService.addToCart(itemId, 1);
      if (response.success) {
        await fetchCartData();
        showNotification(`Added "${itemName}" to cart!`);
        setIsCartOpen(true);
      }
    } catch (err) {
      showNotification('Failed to add item to cart', 'error');
    }
  };

  const handleUpdateQuantity = async (cartId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(cartId);
      return;
    }
    try {
      const response = await orderService.updateCartQuantity(cartId, quantity);
      if (response.success) {
        await fetchCartData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromCart = async (cartId) => {
    try {
      const response = await orderService.removeFromCart(cartId);
      if (response.success) {
        await fetchCartData();
        showNotification('Item removed from cart');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Favorites toggle
  const handleToggleFavorite = async (itemId, itemName) => {
    try {
      const response = await orderService.toggleFavorite(itemId);
      if (response.success) {
        await fetchFavoritesData();
        showNotification(
          response.isFavorite 
            ? `Bookmarked "${itemName}" as favorite!` 
            : `Removed "${itemName}" from favorites`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Place Order transaction trigger
  const handlePlaceOrder = async () => {
    try {
      const response = await orderService.placeOrder();
      if (response.success) {
        showNotification('Order placed successfully! Enqueued in FIFO Kitchen.', 'success');
        setIsCartOpen(false);
        setCart([]);
        // Refresh active orders
        await fetchActiveOrdersData();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Checkout failed. Please try again.', 'error');
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    setMenuItems([item]);
  };

  const handleClearSearch = async () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const response = await menuService.getMenuItems(selectedCategory);
      if (response.success) setMenuItems(response.menuItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      {/* Toast Alert Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-semibold text-sm transition-all flex items-center space-x-2 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent font-display">CampusBites</span>
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full uppercase">Student Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart Icon Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition relative"
            >
              <FiShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition">
              {isDarkMode ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <div className="text-sm font-medium hidden md:block text-slate-700 dark:text-slate-300">
              Welcome, {user?.name || 'Student'}
            </div>
            <button onClick={handleLogout} className="flex items-center space-x-1 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition">
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cart Sliding Drawer overlay */}
      {isCartOpen && (
        <>
          <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity"></div>
          <div className="fixed right-0 top-0 bottom-0 z-40 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between transition-transform transform translate-x-0">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
                  <FiShoppingCart />
                  <span>My Cart</span>
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">Your cart is empty. Add delicious bites to begin!</div>
              ) : (
                <div className="space-y-4 my-6 overflow-y-auto max-h-[60vh] pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-lg border border-slate-100 dark:border-slate-800/30">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">₹{parseFloat(item.price).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-md py-0.5 px-1">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-primary-600"><FiMinus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-primary-600"><FiPlus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-4">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-base">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Taxes (5%)</span>
                  <span>₹{(cartSubtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-950 dark:text-white text-lg border-t border-dashed border-slate-100 dark:border-slate-800 pt-2">
                  <span>Grand Total</span>
                  <span>₹{(cartSubtotal * 1.05).toFixed(2)}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-md shadow-primary-600/20 active:scale-[0.98] transition"
                >
                  Confirm & Checkout Order
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Area: Search & Categories */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Custom Trie Search Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative transition-colors duration-300">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Search Food</h3>
              <div className="relative" ref={suggestionsRef}>
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                  placeholder="Type (e.g. coffee, burger)..." 
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650">
                    <FiX className="w-4 h-4" />
                  </button>
                )}

                {/* Autocomplete Dropdown Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {suggestions.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.category_name}</p>
                        </div>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">₹{parseFloat(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {showSuggestions && searchQuery && suggestions.length === 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30">
                    No matching food found in Trie.
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors duration-300">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button 
                    key={cat.id === null ? 'all' : cat.id} 
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedCategory === cat.id 
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300' 
                        : 'text-slate-655 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Area: Menu Items list */}
          <div className="lg:col-span-3 space-y-8">
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 opacity-15 flex items-center justify-center pointer-events-none">
                <FiShoppingCart className="w-56 h-56 -rotate-12 translate-x-12 translate-y-12" />
              </div>
              <div className="relative z-10 max-w-lg">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">OAC Delicious Meals</h2>
                <p className="mt-2 text-primary-100 text-sm sm:text-base leading-relaxed">Skip the queue, order directly from your mobile, and pick up your hot and freshly prepared meals in minutes!</p>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FiTrendingUp className="text-primary-500" />
                  <span>Menu List</span>
                </h3>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900/50 rounded-xl">{error}</p>
              )}

              {loading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading menus...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {menuItems.map(item => {
                    const isFav = favorites.some(fav => fav.id === item.id);
                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all group flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 rounded-full">
                              {item.category_name || 'Uncategorized'}
                            </span>
                            <button 
                              onClick={() => handleToggleFavorite(item.id, item.name)} 
                              className={`transition p-1 hover:scale-110 ${
                                isFav ? 'text-red-500' : 'text-slate-350 hover:text-red-550'
                              }`}
                            >
                              <FiHeart className="w-5 h-5 fill-current" />
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-primary-500 transition">{item.name}</h4>
                          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">{item.description || 'Freshly prepared hot and delicious meal.'}</p>
                        </div>
                        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">₹{parseFloat(item.price).toFixed(2)}</span>
                          <button 
                            onClick={() => handleAddToCart(item.id, item.name)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            <FiShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Active Orders list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors duration-300">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <FiClock className="text-primary-500" />
                <span>My Active Orders</span>
              </h3>
              
              {activeOrders.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">You have no active orders in preparation.</p>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <div key={order.id} className="border border-slate-150 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                      <div className="mb-3 sm:mb-0 text-center sm:text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Order #CB-{order.id}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 animate-pulse' :
                          order.status === 'preparing' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 animate-pulse' :
                          'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                        }`}>
                          {order.status === 'ready_for_pickup' ? 'Ready for Pickup' : order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
