const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'campusbites_super_secure_jwt_secret_key_2026', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  // 1. Validate inputs
  if (!name || !email || !password) {
    res.status(400);
    return next(new Error('Please fill in all registration fields'));
  }

  try {
    // 2. Check if user already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400);
      return next(new Error('User already exists with this email address'));
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user in database (Default role is student)
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    const userId = result.insertId;

    // 5. Send back user info & token
    res.status(201).json({
      success: true,
      user: {
        id: userId,
        name: name,
        email: email,
        role: 'student'
      },
      token: generateToken(userId)
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Validate inputs
  if (!email || !password) {
    res.status(400);
    return next(new Error('Please provide email and password'));
  }

  try {
    // 2. Query user record from MySQL
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 3. Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 4. Return success response with token
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Protected by JWT)
const getUserProfile = async (req, res, next) => {
  // req.user is loaded in protect middleware
  if (!req.user) {
    res.status(404);
    return next(new Error('User not found'));
  }

  res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
