const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
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
  section: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'zip', 'link', 'other']
    },
    url: String
  }],
  transcript: {
    type: String
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  watchCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Lecture = mongoose.model('Lecture', LectureSchema);

module.exports = Lecture; 