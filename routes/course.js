const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { isAuth, isInstructor } = require('../middleware/auth');

// @route   GET api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { published: true };
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get courses
    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCourses = await Course.countDocuments(query);
    
    res.json({
      courses,
      totalPages: Math.ceil(totalCourses / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate({
        path: 'sections.lectures',
        select: 'title duration isPreview'
      })
      .populate('quizzes', 'title');
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if course is published or user is instructor
    if (!course.published && (!req.user || course.instructor._id.toString() !== req.user.id)) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    res.json(course);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/courses
// @desc    Create a course
// @access  Private/Instructor
router.post('/', [isAuth, isInstructor], async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      tags,
      thumbnail,
      requirements,
      whatYouWillLearn
    } = req.body;
    
    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    // Check if slug already exists
    const slugExists = await Course.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now().toString().slice(-4)}` : slug;
    
    // Create course
    const course = new Course({
      title,
      slug: finalSlug,
      description,
      instructor: req.user.id,
      category,
      level,
      price: price || 0,
      thumbnail,
      tags: tags || [],
      requirements: requirements || [],
      whatYouWillLearn: whatYouWillLearn || []
    });
    
    await course.save();
    
    // Add course to instructor's created courses
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id }
    });
    
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/courses/:id
// @desc    Update a course
// @access  Private/Instructor
router.put('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if user is the instructor of the course
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedCourse);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private/Instructor
router.delete('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if user is the instructor of the course
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Delete course
    await course.remove();
    
    // Remove course from instructor's created courses
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { createdCourses: course._id }
    });
    
    res.json({ msg: 'Course deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', isAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if course is published
    if (!course.published) {
      return res.status(400).json({ msg: 'Cannot enroll in unpublished course' });
    }
    
    // Check if user is already enrolled
    const user = await User.findById(req.user.id);
    const alreadyEnrolled = user.enrolledCourses.some(
      c => c.courseId.toString() === req.params.id
    );
    
    if (alreadyEnrolled) {
      return res.status(400).json({ msg: 'Already enrolled in this course' });
    }
    
    // Add course to user's enrolled courses
    user.enrolledCourses.push({
      courseId: req.params.id,
      enrollmentDate: Date.now(),
      progress: 0
    });
    
    await user.save();
    
    // Increment course's total students
    course.totalStudents += 1;
    await course.save();
    
    res.json({ msg: 'Successfully enrolled in course' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/courses/:id/rate
// @desc    Rate a course
// @access  Private
router.post('/:id/rate', isAuth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if user is enrolled in the course
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      c => c.courseId.toString() === req.params.id
    );
    
    if (!isEnrolled) {
      return res.status(400).json({ msg: 'You must be enrolled to rate this course' });
    }
    
    // Check if user has already rated
    const ratingIndex = course.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );
    
    if (ratingIndex !== -1) {
      // Update existing rating
      course.ratings[ratingIndex].rating = rating;
      course.ratings[ratingIndex].review = review;
    } else {
      // Add new rating
      course.ratings.push({
        user: req.user.id,
        rating,
        review
      });
    }
    
    // Calculate average rating
    course.calculateAverageRating();
    
    await course.save();
    
    res.json(course.ratings);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/courses/:id/sections
// @desc    Get course sections
// @access  Private/Enrolled
router.get('/:id/sections', isAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'sections.lectures',
        select: 'title duration isPreview'
      });
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if user is instructor or enrolled
    const isInstructor = course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === req.params.id
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    res.json(course.sections);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 