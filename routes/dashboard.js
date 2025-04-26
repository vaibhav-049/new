const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');

// @route   GET /dashboard
// @desc    Display user dashboard
// @access  Private
router.get('/', isAuth, (req, res) => {
  try {
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// @route   GET /dashboard/courses
// @desc    Display user courses
// @access  Private
router.get('/courses', isAuth, (req, res) => {
  try {
    res.render('my-courses', {
      title: 'My Courses',
      user: req.user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// @route   GET /dashboard/profile
// @desc    Display user profile
// @access  Private
router.get('/profile', isAuth, (req, res) => {
  try {
    res.render('profile', {
      title: 'My Profile',
      user: req.user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server error' });
  }
});

module.exports = router; 