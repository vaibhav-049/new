const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');
const { isAuth, isInstructor } = require('../middleware/auth');

// @route   GET api/live-sessions
// @desc    Get all live sessions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { upcoming, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // If upcoming is true, only get sessions that are scheduled or live
    if (upcoming === 'true') {
      query.status = { $in: ['scheduled', 'live'] };
      query['schedule.startTime'] = { $gte: new Date() };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get live sessions
    const liveSessions = await LiveSession.find(query)
      .populate('instructor', 'name avatar')
      .populate('course', 'title')
      .sort({ 'schedule.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalSessions = await LiveSession.countDocuments(query);
    
    res.json({
      liveSessions,
      totalPages: Math.ceil(totalSessions / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/live-sessions/:id
// @desc    Get live session by ID
// @access  Private/Enrolled
router.get('/:id', isAuth, async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('course', 'title');
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if user is instructor of the session
    const isInstructorOfSession = liveSession.instructor._id.toString() === req.user.id;
    
    if (!isInstructorOfSession && liveSession.course) {
      // Check if user is enrolled in the course
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === liveSession.course._id.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    res.json(liveSession);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/live-sessions
// @desc    Create a live session
// @access  Private/Instructor
router.post('/', [isAuth, isInstructor], async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      startTime,
      endTime,
      notifyStudents,
      resources
    } = req.body;
    
    // Validate dates
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    // Check if course exists and user is instructor (if courseId provided)
    if (courseId) {
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }
      
      if (course.instructor.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to create live sessions for this course' });
      }
    }
    
    // Generate a unique room ID
    const roomId = `live_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create live session
    const liveSession = new LiveSession({
      title,
      description,
      course: courseId,
      instructor: req.user.id,
      schedule: {
        startTime,
        endTime
      },
      roomId,
      status: 'scheduled',
      notifyStudents: notifyStudents !== false,
      resources: resources || []
    });
    
    await liveSession.save();
    
    // If course ID is provided and notify students is true, add notifications
    if (courseId && notifyStudents !== false) {
      const course = await Course.findById(courseId);
      
      // Find all users enrolled in the course
      const enrolledUsers = await User.find({
        'enrolledCourses.courseId': courseId
      });
      
      // Add notifications
      const notification = {
        message: `New live session scheduled for "${course.title}": ${title}`,
        type: 'course',
        read: false,
        createdAt: Date.now()
      };
      
      const updatePromises = enrolledUsers.map(user => 
        User.findByIdAndUpdate(user._id, {
          $push: { notifications: notification }
        })
      );
      
      await Promise.all(updatePromises);
      
      // Add reminders
      const startDate = new Date(startTime);
      
      // 24 hours before
      const reminder24h = new Date(startDate);
      reminder24h.setDate(reminder24h.getDate() - 1);
      
      // 1 hour before
      const reminder1h = new Date(startDate);
      reminder1h.setHours(reminder1h.getHours() - 1);
      
      // 15 minutes before
      const reminder15min = new Date(startDate);
      reminder15min.setMinutes(reminder15min.getMinutes() - 15);
      
      liveSession.reminders.push(
        { time: reminder24h, type: '24h', sent: false },
        { time: reminder1h, type: '1h', sent: false },
        { time: reminder15min, type: '15min', sent: false }
      );
      
      await liveSession.save();
    }
    
    res.json(liveSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/live-sessions/:id
// @desc    Update a live session
// @access  Private/Instructor
router.put('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if user is instructor of the session
    if (liveSession.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Don't allow updating after session is completed or cancelled
    if (liveSession.status === 'completed' || liveSession.status === 'cancelled') {
      return res.status(400).json({ msg: 'Cannot update completed or cancelled sessions' });
    }
    
    // Update live session
    const updatedSession = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    // If start time or end time changed and notifyStudents is true, update notifications
    if (
      (req.body.startTime || req.body.endTime) && 
      liveSession.notifyStudents && 
      liveSession.course
    ) {
      const course = await Course.findById(liveSession.course);
      
      // Find all users enrolled in the course
      const enrolledUsers = await User.find({
        'enrolledCourses.courseId': liveSession.course
      });
      
      // Add notifications
      const notification = {
        message: `Live session "${liveSession.title}" for "${course.title}" has been rescheduled`,
        type: 'course',
        read: false,
        createdAt: Date.now()
      };
      
      const updatePromises = enrolledUsers.map(user => 
        User.findByIdAndUpdate(user._id, {
          $push: { notifications: notification }
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update reminders
      if (req.body.startTime) {
        // Delete existing reminders
        updatedSession.reminders = [];
        
        // Add new reminders
        const startDate = new Date(req.body.startTime);
        
        // 24 hours before
        const reminder24h = new Date(startDate);
        reminder24h.setDate(reminder24h.getDate() - 1);
        
        // 1 hour before
        const reminder1h = new Date(startDate);
        reminder1h.setHours(reminder1h.getHours() - 1);
        
        // 15 minutes before
        const reminder15min = new Date(startDate);
        reminder15min.setMinutes(reminder15min.getMinutes() - 15);
        
        updatedSession.reminders.push(
          { time: reminder24h, type: '24h', sent: false },
          { time: reminder1h, type: '1h', sent: false },
          { time: reminder15min, type: '15min', sent: false }
        );
        
        await updatedSession.save();
      }
    }
    
    res.json(updatedSession);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/live-sessions/:id
// @desc    Delete a live session
// @access  Private/Instructor
router.delete('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if user is instructor of the session
    if (liveSession.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Don't allow deleting if session is live
    if (liveSession.status === 'live') {
      return res.status(400).json({ msg: 'Cannot delete a live session that is currently active' });
    }
    
    // If notifyStudents is true and session is scheduled, notify students about cancellation
    if (
      liveSession.status === 'scheduled' && 
      liveSession.notifyStudents && 
      liveSession.course
    ) {
      const course = await Course.findById(liveSession.course);
      
      // Find all users enrolled in the course
      const enrolledUsers = await User.find({
        'enrolledCourses.courseId': liveSession.course
      });
      
      // Add notifications
      const notification = {
        message: `Live session "${liveSession.title}" for "${course.title}" has been cancelled`,
        type: 'course',
        read: false,
        createdAt: Date.now()
      };
      
      const updatePromises = enrolledUsers.map(user => 
        User.findByIdAndUpdate(user._id, {
          $push: { notifications: notification }
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    // Delete session
    await liveSession.remove();
    
    res.json({ msg: 'Live session deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/live-sessions/:id/start
// @desc    Start a live session
// @access  Private/Instructor
router.put('/:id/start', [isAuth, isInstructor], async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if user is instructor of the session
    if (liveSession.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Don't allow starting if session is completed or cancelled
    if (liveSession.status === 'completed' || liveSession.status === 'cancelled') {
      return res.status(400).json({ msg: 'Cannot start a completed or cancelled session' });
    }
    
    // Update status to live
    liveSession.status = 'live';
    await liveSession.save();
    
    // If notifyStudents is true, notify students that session is live
    if (liveSession.notifyStudents && liveSession.course) {
      const course = await Course.findById(liveSession.course);
      
      // Find all users enrolled in the course
      const enrolledUsers = await User.find({
        'enrolledCourses.courseId': liveSession.course
      });
      
      // Add notifications
      const notification = {
        message: `Live session "${liveSession.title}" for "${course.title}" has started`,
        type: 'course',
        read: false,
        createdAt: Date.now()
      };
      
      const updatePromises = enrolledUsers.map(user => 
        User.findByIdAndUpdate(user._id, {
          $push: { notifications: notification }
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    res.json(liveSession);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/live-sessions/:id/end
// @desc    End a live session
// @access  Private/Instructor
router.put('/:id/end', [isAuth, isInstructor], async (req, res) => {
  try {
    const { recordingUrl } = req.body;
    
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if user is instructor of the session
    if (liveSession.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Don't allow ending if session is not live
    if (liveSession.status !== 'live') {
      return res.status(400).json({ msg: 'Can only end a session that is currently live' });
    }
    
    // Update status to completed and add recording URL if provided
    liveSession.status = 'completed';
    if (recordingUrl) {
      liveSession.recordingUrl = recordingUrl;
    }
    
    await liveSession.save();
    
    // If notifyStudents is true and recording URL is provided, notify students
    if (liveSession.notifyStudents && recordingUrl && liveSession.course) {
      const course = await Course.findById(liveSession.course);
      
      // Find all users enrolled in the course
      const enrolledUsers = await User.find({
        'enrolledCourses.courseId': liveSession.course
      });
      
      // Add notifications
      const notification = {
        message: `Recording for "${liveSession.title}" in "${course.title}" is now available`,
        type: 'course',
        read: false,
        createdAt: Date.now()
      };
      
      const updatePromises = enrolledUsers.map(user => 
        User.findByIdAndUpdate(user._id, {
          $push: { notifications: notification }
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    res.json(liveSession);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/live-sessions/:id/join
// @desc    Join a live session
// @access  Private/Enrolled
router.post('/:id/join', isAuth, async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if session is live
    if (liveSession.status !== 'live') {
      return res.status(400).json({ msg: 'Session is not currently live' });
    }
    
    // Check if user is instructor or enrolled
    const isInstructor = liveSession.instructor.toString() === req.user.id;
    
    if (!isInstructor && liveSession.course) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === liveSession.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    // Add user to participants if not already there
    const participantIndex = liveSession.participants.findIndex(
      p => p.user.toString() === req.user.id
    );
    
    if (participantIndex === -1) {
      liveSession.participants.push({
        user: req.user.id,
        joinedAt: Date.now()
      });
    } else {
      // If user is rejoining, update joinedAt and remove leftAt
      liveSession.participants[participantIndex].joinedAt = Date.now();
      liveSession.participants[participantIndex].leftAt = undefined;
    }
    
    await liveSession.save();
    
    res.json({
      roomId: liveSession.roomId,
      title: liveSession.title,
      instructor: liveSession.instructor
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/live-sessions/:id/leave
// @desc    Leave a live session
// @access  Private
router.post('/:id/leave', isAuth, async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Find user in participants
    const participantIndex = liveSession.participants.findIndex(
      p => p.user.toString() === req.user.id
    );
    
    if (participantIndex !== -1) {
      liveSession.participants[participantIndex].leftAt = Date.now();
      await liveSession.save();
    }
    
    res.json({ msg: 'Successfully left the session' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/live-sessions/:id/chat
// @desc    Send a chat message
// @access  Private/Enrolled
router.post('/:id/chat', isAuth, async (req, res) => {
  try {
    const { message, isSuperchat, superchatAmount } = req.body;
    
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    
    // Check if session is live
    if (liveSession.status !== 'live') {
      return res.status(400).json({ msg: 'Session is not currently live' });
    }
    
    // Check if user is instructor or enrolled
    const isInstructor = liveSession.instructor.toString() === req.user.id;
    
    if (!isInstructor && liveSession.course) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === liveSession.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    // Add chat message
    const chatMessage = {
      user: req.user.id,
      message,
      timestamp: Date.now()
    };
    
    // If it's a superchat, add the amount
    if (isSuperchat && superchatAmount) {
      chatMessage.isSuperchat = true;
      chatMessage.superchatAmount = superchatAmount;
    }
    
    liveSession.chat.push(chatMessage);
    await liveSession.save();
    
    // Populate user information
    const userInfo = await User.findById(req.user.id).select('name avatar');
    
    const responseMessage = {
      ...chatMessage,
      user: {
        _id: userInfo._id,
        name: userInfo.name,
        avatar: userInfo.avatar
      }
    };
    
    res.json(responseMessage);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Live session not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 