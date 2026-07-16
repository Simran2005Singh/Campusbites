const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuTrie = require('./services/menuTrie');
const { loadActiveOrdersIntoQueue } = require('./services/orderQueue');

// Load environment variables
dotenv.config();

const app = express();

// Standard middlewares
app.use(cors({
  origin: '*', // We can restrict this to the frontend URL later if needed
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// Initialize search Trie & Kitchen Queue on startup
async function initializeTrieIndex() {
  try {
    const [menuItems] = await db.query('SELECT * FROM menu_items WHERE is_available = 1');
    for (const item of menuItems) {
      menuTrie.insert(item.name, item);
    }
    console.log(`✅ Loaded ${menuItems.length} active menu items into search Trie!`);
    
    // Load orders into FIFO kitchen queue
    await loadActiveOrdersIntoQueue();
  } catch (error) {
    console.warn('⚠️ Search Trie or Kitchen Queue initialization skipped or database unreachable.');
  }
}

initializeTrieIndex();

// Health check API
app.get('/api/health', async (req, res) => {
  try {
    // Basic query to check DB availability
    await db.query('SELECT 1');
    res.status(200).json({
      status: 'success',
      message: 'CampusBites API is healthy and connected to MySQL!',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'CampusBites API is running but database is unreachable.',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Serve static assets if necessary
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
