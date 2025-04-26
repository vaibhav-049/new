const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-learning-platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'your_jwt_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Load passport configuration
require('./config/passport');

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Direct dashboard access for development purposes
app.get('/dashboard-ui', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const courseRoutes = require('./routes/course');
const lectureRoutes = require('./routes/lecture');
const quizRoutes = require('./routes/quiz');
const liveSessionRoutes = require('./routes/liveSession');
const chatbotRoutes = require('./routes/chatbot');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/dashboard', dashboardRoutes);

// Socket.io for chat and live sessions
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Join a room (course or live session)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });
  
  // Handle chat messages
  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('message', {
      userId: data.userId,
      username: data.username,
      message: data.message,
      timestamp: new Date(),
      isSuperchat: data.isSuperchat
    });
  });
  
  // Handle super chat
  socket.on('super-chat', (data) => {
    io.to(data.roomId).emit('super-chat', {
      userId: data.userId,
      username: data.username,
      message: data.message,
      amount: data.amount,
      timestamp: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 