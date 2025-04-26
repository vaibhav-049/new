const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { isAuth, isInstructor } = require('../middleware/auth');

// @route   GET api/quizzes/:id
// @desc    Get quiz by ID
// @access  Private/Enrolled
router.get('/:id', isAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title instructor');
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    const course = await Course.findById(quiz.course);
    
    // Check if user is instructor of the course
    const isInstructorOfCourse = course.instructor.toString() === req.user.id;
    
    if (!isInstructorOfCourse) {
      // Check if user is enrolled in the course
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === quiz.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
      
      // Remove correct answers if not showing answers after submission
      if (!quiz.showAnswersAfterSubmission) {
        quiz.questions.forEach(question => {
          if (question.type === 'multiple-choice' || question.type === 'checkbox') {
            question.options.forEach(option => {
              delete option.isCorrect;
            });
          } else if (question.type === 'fill-in-blank') {
            delete question.correctAnswer;
          }
        });
      }
    }
    
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/quizzes
// @desc    Create a quiz
// @access  Private/Instructor
router.post('/', [isAuth, isInstructor], async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      passingScore,
      timeLimit,
      questions,
      shuffleQuestions,
      shuffleOptions,
      allowReview,
      showAnswersAfterSubmission,
      attemptsAllowed,
      startDate,
      endDate
    } = req.body;
    
    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to add quizzes to this course' });
    }
    
    // Create quiz
    const quiz = new Quiz({
      title,
      description,
      course: courseId,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 0,
      questions: questions || [],
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      allowReview: allowReview || true,
      showAnswersAfterSubmission: showAnswersAfterSubmission || true,
      attemptsAllowed: attemptsAllowed || 0,
      startDate,
      endDate
    });
    
    await quiz.save();
    
    // Add quiz to course
    course.quizzes.push(quiz._id);
    await course.save();
    
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/quizzes/:id
// @desc    Update a quiz
// @access  Private/Instructor
router.put('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user is instructor of the course
    const course = await Course.findById(quiz.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedQuiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/quizzes/:id
// @desc    Delete a quiz
// @access  Private/Instructor
router.delete('/:id', [isAuth, isInstructor], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user is instructor of the course
    const course = await Course.findById(quiz.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Remove quiz from course
    course.quizzes = course.quizzes.filter(
      q => q.toString() !== req.params.id
    );
    
    await course.save();
    
    // Delete quiz
    await quiz.remove();
    
    res.json({ msg: 'Quiz deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/quizzes/:id/submit
// @desc    Submit a quiz attempt
// @access  Private/Enrolled
router.post('/:id/submit', isAuth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user is enrolled in the course
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      c => c.courseId.toString() === quiz.course.toString()
    );
    
    if (!isEnrolled) {
      return res.status(401).json({ msg: 'Not enrolled in this course' });
    }
    
    // Check if quiz is active
    if (!quiz.active) {
      return res.status(400).json({ msg: 'Quiz is not active' });
    }
    
    // Check if quiz has started
    if (quiz.startDate && new Date() < quiz.startDate) {
      return res.status(400).json({ msg: 'Quiz has not started yet' });
    }
    
    // Check if quiz has ended
    if (quiz.endDate && new Date() > quiz.endDate) {
      return res.status(400).json({ msg: 'Quiz has ended' });
    }
    
    // Check if user has exceeded attempts
    if (quiz.attemptsAllowed > 0) {
      const userAttempts = quiz.attempts.filter(
        a => a.user.toString() === req.user.id
      ).length;
      
      if (userAttempts >= quiz.attemptsAllowed) {
        return res.status(400).json({ msg: 'Maximum attempts reached' });
      }
    }
    
    // Score the answers
    const scoredAnswers = [];
    let totalPoints = 0;
    let earnedPoints = 0;
    
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      let pointsEarned = 0;
      
      if (question.type === 'multiple-choice') {
        // For multiple choice, check if user selected the correct option
        const correctOption = question.options.findIndex(opt => opt.isCorrect);
        isCorrect = userAnswer === correctOption;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'true-false') {
        // For true-false, check if user selected the correct option
        const correctOption = question.options.findIndex(opt => opt.isCorrect);
        isCorrect = userAnswer === correctOption;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'checkbox') {
        // For checkbox, check if user selected all correct options and no incorrect ones
        const correctOptions = question.options
          .map((opt, i) => opt.isCorrect ? i : -1)
          .filter(i => i !== -1);
        
        const userSelected = Array.isArray(userAnswer) ? userAnswer : [];
        
        isCorrect = 
          correctOptions.length === userSelected.length && 
          correctOptions.every(opt => userSelected.includes(opt));
        
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'fill-in-blank') {
        // For fill-in-blank, check if user's answer matches the correct answer
        // Case insensitive match and trim whitespace
        isCorrect = 
          userAnswer && 
          userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        
        pointsEarned = isCorrect ? question.points : 0;
      }
      
      totalPoints += question.points;
      earnedPoints += pointsEarned;
      
      scoredAnswers.push({
        questionIndex: index,
        userAnswer,
        isCorrect,
        pointsEarned
      });
    });
    
    // Calculate percentage score
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    
    // Add attempt to quiz
    quiz.attempts.push({
      user: req.user.id,
      score,
      answers: scoredAnswers,
      submittedAt: Date.now(),
      timeSpent
    });
    
    await quiz.save();
    
    // Add quiz to user's completed quizzes if not already completed
    const enrolledCourseIndex = user.enrolledCourses.findIndex(
      c => c.courseId.toString() === quiz.course.toString()
    );
    
    if (enrolledCourseIndex !== -1) {
      const completedQuizIndex = user.enrolledCourses[enrolledCourseIndex].completedQuizzes.findIndex(
        q => q.quizId.toString() === quiz._id.toString()
      );
      
      if (completedQuizIndex === -1) {
        user.enrolledCourses[enrolledCourseIndex].completedQuizzes.push({
          quizId: quiz._id,
          score,
          completedAt: Date.now()
        });
      } else {
        // Update score if higher
        if (score > user.enrolledCourses[enrolledCourseIndex].completedQuizzes[completedQuizIndex].score) {
          user.enrolledCourses[enrolledCourseIndex].completedQuizzes[completedQuizIndex].score = score;
          user.enrolledCourses[enrolledCourseIndex].completedQuizzes[completedQuizIndex].completedAt = Date.now();
        }
      }
      
      await user.save();
    }
    
    // Return results
    const passed = score >= quiz.passingScore;
    
    res.json({
      score,
      passed,
      answers: scoredAnswers,
      passingScore: quiz.passingScore,
      showAnswers: quiz.showAnswersAfterSubmission
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/quizzes/:id/attempts
// @desc    Get user's attempts for a quiz
// @access  Private/Enrolled
router.get('/:id/attempts', isAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user is instructor or enrolled
    const course = await Course.findById(quiz.course);
    const isInstructorOfCourse = course.instructor.toString() === req.user.id;
    
    if (!isInstructorOfCourse) {
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        c => c.courseId.toString() === quiz.course.toString()
      );
      
      if (!isEnrolled) {
        return res.status(401).json({ msg: 'Not enrolled in this course' });
      }
      
      // Filter attempts to only show user's attempts
      const userAttempts = quiz.attempts.filter(
        a => a.user.toString() === req.user.id
      );
      
      return res.json(userAttempts);
    }
    
    // For instructor, show all attempts grouped by user
    const attemptsByUser = {};
    
    for (const attempt of quiz.attempts) {
      const userId = attempt.user.toString();
      
      if (!attemptsByUser[userId]) {
        const user = await User.findById(userId).select('name email');
        attemptsByUser[userId] = {
          user,
          attempts: []
        };
      }
      
      attemptsByUser[userId].attempts.push(attempt);
    }
    
    res.json(Object.values(attemptsByUser));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 