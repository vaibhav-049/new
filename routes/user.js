const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuth, isAdmin } = require('../middleware/auth');

// @route   GET api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('enrolledCourses.courseId', 'title thumbnail')
      .populate('createdCourses', 'title thumbnail');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', isAuth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio) updateFields.bio = bio;
    if (avatar) updateFields.avatar = avatar;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'title thumbnail instructor totalLectures',
        populate: {
          path: 'instructor',
          select: 'name'
        }
      });
    
    // Get enrolled courses
    const enrolledCourses = user.enrolledCourses.map(course => ({
      id: course.courseId._id,
      title: course.courseId.title,
      thumbnail: course.courseId.thumbnail,
      instructor: course.courseId.instructor.name,
      progress: course.progress,
      enrollmentDate: course.enrollmentDate
    }));
    
    // Get notifications
    const notifications = user.notifications.filter(n => !n.read).slice(0, 5);
    
    res.json({
      name: user.name,
      avatar: user.avatar,
      enrolledCourses,
      notifications
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    res.json(user.notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/notifications/:id
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find notification index
    const notificationIndex = user.notifications.findIndex(
      n => n._id.toString() === req.params.id
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Mark as read
    user.notifications[notificationIndex].read = true;
    await user.save();
    
    res.json(user.notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/all
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/all', [isAuth, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 