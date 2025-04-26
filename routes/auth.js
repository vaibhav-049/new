const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAuth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Save user to database
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: user.getProfile() });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(400).json({ msg: info.message });
    }
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: user.getProfile() });
      }
    );
  })(req, res, next);
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Google Auth Routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Create JWT token
    const payload = {
      user: {
        id: req.user.id
      }
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`/auth/success?token=${token}`);
  }
);

// GitHub Auth Routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Create JWT token
    const payload = {
      user: {
        id: req.user.id
      }
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`/auth/success?token=${token}`);
  }
);

// Microsoft Auth Routes
router.get('/microsoft',
  passport.authenticate('microsoft', { prompt: 'select_account' })
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  (req, res) => {
    // Create JWT token
    const payload = {
      user: {
        id: req.user.id
      }
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`/auth/success?token=${token}`);
  }
);

// @route   GET api/auth/logout
// @desc    Logout user
// @access  Public
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ msg: 'User logged out' });
});

module.exports = router; 