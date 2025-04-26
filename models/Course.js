const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: '/images/default-course.jpg'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'all-levels'
  },
  language: {
    type: String,
    default: 'English'
  },
  sections: [{
    title: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    lectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    }]
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalLectures: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  tags: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  whatYouWillLearn: [{
    type: String
  }],
  published: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  liveClassEnabled: {
    type: Boolean,
    default: false
  },
  liveClassSchedule: [{
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    roomId: String
  }]
}, { timestamps: true });

// Calculate average rating when a rating is added or updated
CourseSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  this.averageRating = (sum / this.ratings.length).toFixed(1);
};

// Update total lectures count
CourseSchema.methods.updateTotalLectures = function() {
  let count = 0;
  this.sections.forEach(section => {
    count += section.lectures.length;
  });
  this.totalLectures = count;
};

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course; 