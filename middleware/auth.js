const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated
exports.isAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded.user;

    // Check if user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user is an instructor
exports.isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied, instructor role required' });
    }
    
    next();
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Middleware to check if user is an admin
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied, admin role required' });
    }
    
    next();
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 