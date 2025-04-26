const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if the user is registering with email/password
      return !this.googleId && !this.githubId && !this.microsoftId;
    },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png'
  },
  googleId: {
    type: String
  },
  githubId: {
    type: String
  },
  microsoftId: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  bio: {
    type: String,
    maxlength: 500
  },
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    }],
    completedQuizzes: [{
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },
      score: Number,
      completedAt: Date
    }],
    progress: {
      type: Number,
      default: 0
    }
  }],
  createdCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  notifications: [{
    message: String,
    type: {
      type: String,
      enum: ['course', 'quiz', 'announcement', 'other']
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified (or new)
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to get user profile
UserSchema.methods.getProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    bio: this.bio,
    emailVerified: this.emailVerified,
    enrolledCourses: this.enrolledCourses,
    createdCourses: this.createdCourses
  };
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 