const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  passingScore: {
    type: Number,
    required: true,
    default: 70 // percentage
  },
  timeLimit: {
    type: Number, // in minutes
    default: 0 // 0 means no time limit
  },
  questions: [{
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'checkbox', 'fill-in-blank'],
      default: 'multiple-choice'
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    correctAnswer: String, // Used for fill-in-blank questions
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  showAnswersAfterSubmission: {
    type: Boolean,
    default: true
  },
  attemptsAllowed: {
    type: Number,
    default: 0 // 0 means unlimited attempts
  },
  active: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  attempts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    answers: [{
      questionIndex: Number,
      userAnswer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      pointsEarned: Number
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number // in seconds
  }]
}, { timestamps: true });

// Calculate total possible points for the quiz
QuizSchema.methods.getTotalPoints = function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
};

// Calculate score for an attempt
QuizSchema.methods.calculateScore = function(attemptIndex) {
  const attempt = this.attempts[attemptIndex];
  if (!attempt) return 0;
  
  const totalPoints = this.getTotalPoints();
  const earnedPoints = attempt.answers.reduce((total, answer) => total + answer.pointsEarned, 0);
  
  return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
};

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = Quiz; 