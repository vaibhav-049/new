const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const { isAuth, isInstructor } = require('../middleware/auth');

// @route   GET api/lectures/:id
// @desc    Get lecture by ID
// @access  Private/Enrolled
router.get('/:id', isAuth, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
      .populate('course', 'title instructor')
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name avatar'
      });
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    const course = await Course.findById(lecture.course);
    
    // Check if user is instructor of the course
    const isInstructorOfCourse = course.instructor.toString() === req.user.id;
    
    if (!isInstructorOfCourse) {
      // Check if lecture is preview
      if (!lecture.isPreview) {
        // Check if user is enrolled in the course
        const user = await User.findById(req.user.id);
        const isEnrolled = user.enrolledCourses.some(
          c => c.courseId.toString() === lecture.course.toString()
        );
        
        if (!isEnrolled) {
          return res.status(401).json({ msg: 'Not enrolled in this course' });
        }
        
        // Add lecture to completed lectures if not already completed
        const enrolledCourseIndex = user.enrolledCourses.findIndex(
          c => c.courseId.toString() === lecture.course.toString()
        );
        
        if (enrolledCourseIndex !== -1) {
          const completedLectures = user.enrolledCourses[enrolledCourseIndex].completedLectures;
          
          if (!completedLectures.includes(lecture._id)) {
            user.enrolledCourses[enrolledCourseIndex].completedLectures.push(lecture._id);
            
            // Calculate progress
            const totalLectures = course.totalLectures || 1;
            const completedCount = user.enrolledCourses[enrolledCourseIndex].completedLectures.length;
            user.enrolledCourses[enrolledCourseIndex].progress = Math.round((completedCount / totalLectures) * 100);
            
            await user.save();
          }
        }
      }
    }
    
    // Increment watch count
    lecture.watchCount += 1;
    await lecture.save();
    
    res.json(lecture);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/lectures
// @desc    Create a lecture
// @access  Private/Instructor
router.post('/', [isAuth, isInstructor], async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      sectionId,
      order,
      videoUrl,
      duration,
      isPreview,
      resources,
      transcript
    } = req.body;
    
    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to add lectures to this course' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(
      section => section._id.toString() === sectionId
    );
    
    if (sectionIndex === -1) {
      return res.status(404).json({ msg: 'Section not found' });
    }
    
    // Create lecture
    const lecture = new Lecture({
      title,
      description,
      course: courseId,
      section: sectionId,
      order,
      videoUrl,
      duration: duration || 0,
      isPreview: isPreview || false,
      resources: resources || [],
      transcript
    });
    
    await lecture.save();
    
    // Add lecture to section
    course.sections[sectionIndex].lectures.push(lecture._id);
    
    // Update total lectures count
    course.updateTotalLectures();
    
    // Update duration
    course.duration += lecture.duration / 60; // Convert seconds to minutes
    
    await course.save();
    
    res.json(lecture);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/lectures/:id
// @desc    Update a lecture
// @access  Private/Instructor
router.put('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    // Check if user is instructor of the course
    const course = await Course.findById(lecture.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update lecture
    const updatedLecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    // If duration changed, update course duration
    if (req.body.duration && req.body.duration !== lecture.duration) {
      const durationDiff = (req.body.duration - lecture.duration) / 60; // Convert seconds to minutes
      course.duration += durationDiff;
      await course.save();
    }
    
    res.json(updatedLecture);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/lectures/:id
// @desc    Delete a lecture
// @access  Private/Instructor
router.delete('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    // Check if user is instructor of the course
    const course = await Course.findById(lecture.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(
      section => section._id.toString() === lecture.section.toString()
    );
    
    if (sectionIndex !== -1) {
      // Remove lecture from section
      const lectureIndex = course.sections[sectionIndex].lectures.findIndex(
        l => l.toString() === req.params.id
      );
      
      if (lectureIndex !== -1) {
        course.sections[sectionIndex].lectures.splice(lectureIndex, 1);
      }
      
      // Update total lectures count
      course.updateTotalLectures();
      
      // Update duration
      course.duration -= lecture.duration / 60; // Convert seconds to minutes
      
      await course.save();
    }
    
    // Delete lecture
    await lecture.remove();
    
    res.json({ msg: 'Lecture deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/lectures/:id/comments
// @desc    Add a comment to a lecture
// @access  Private/Enrolled
router.post('/:id/comments', isAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    // Check if user is enrolled or instructor
    const course = await Course.findById(lecture.course);
    const isInstructorOfCourse = course.instructor.toString() === req.user.id;
    
    if (!isInstructorOfCourse) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === lecture.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    // Add comment
    lecture.comments.unshift({
      user: req.user.id,
      text,
      createdAt: Date.now()
    });
    
    await lecture.save();
    
    // Populate user information
    const populatedLecture = await Lecture.findById(req.params.id)
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      });
    
    res.json(populatedLecture.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/lectures/:id/comments/:comment_id/replies
// @desc    Add a reply to a comment
// @access  Private/Enrolled
router.post('/:id/comments/:comment_id/replies', isAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    // Check if user is enrolled or instructor
    const course = await Course.findById(lecture.course);
    const isInstructorOfCourse = course.instructor.toString() === req.user.id;
    
    if (!isInstructorOfCourse) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === lecture.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
    }
    
    // Find comment
    const comment = lecture.comments.find(
      comment => comment._id.toString() === req.params.comment_id
    );
    
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    
    // Add reply
    comment.replies.unshift({
      user: req.user.id,
      text,
      createdAt: Date.now()
    });
    
    await lecture.save();
    
    // Populate user information
    const populatedLecture = await Lecture.findById(req.params.id)
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name avatar'
      });
    
    const updatedComment = populatedLecture.comments.find(
      comment => comment._id.toString() === req.params.comment_id
    );
    
    res.json(updatedComment.replies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 