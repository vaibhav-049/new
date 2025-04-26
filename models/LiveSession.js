const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema({
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
    ref: 'Course'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  recordingUrl: {
    type: String
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  chat: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    isSuperchat: {
      type: Boolean,
      default: false
    },
    superchatAmount: {
      type: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'zip', 'link', 'other']
    },
    url: String
  }],
  notifyStudents: {
    type: Boolean,
    default: true
  },
  reminders: [{
    time: Date, // When the reminder was/will be sent
    type: {
      type: String,
      enum: ['24h', '1h', '15min', 'custom'],
      default: 'custom'
    },
    sent: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Method to check if the session is currently live
LiveSessionSchema.methods.isLive = function() {
  const now = new Date();
  return this.status === 'live' && 
         now >= this.schedule.startTime && 
         now <= this.schedule.endTime;
};

// Method to get total duration in minutes
LiveSessionSchema.methods.getDuration = function() {
  return Math.round((this.schedule.endTime - this.schedule.startTime) / (1000 * 60));
};

// Method to get participant count
LiveSessionSchema.methods.getParticipantCount = function() {
  return this.participants.length;
};

// Method to get superchats
LiveSessionSchema.methods.getSuperchats = function() {
  return this.chat.filter(message => message.isSuperchat);
};

// Method to get total superchat amount
LiveSessionSchema.methods.getTotalSuperchatAmount = function() {
  return this.chat.reduce((total, message) => {
    return total + (message.isSuperchat ? message.superchatAmount : 0);
  }, 0);
};

const LiveSession = mongoose.model('LiveSession', LiveSessionSchema);

module.exports = LiveSession; 