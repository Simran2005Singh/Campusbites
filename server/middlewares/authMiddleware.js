const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes middleware
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization Header and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusbites_super_secure_jwt_secret_key_2026');

      // Get user from database (exclude password)
      const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);

      if (rows.length === 0) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }

      req.user = rows[0];
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token provided'));
  }
};

// Role authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Forbidden - Action requires role: [${roles.join(', ')}]`));
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
