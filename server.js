const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const session = require('express-session');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studysync';

// Mock User and Course data for development when MongoDB is not available
let mockUsers = [];
let mockCourses = [];
let useMockData = false;

// Connect to MongoDB with fallback to mock data
mongoose.connect(MONGODB_URI, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  waitQueueTimeoutMS: 5000
})
  .then(() => {
    console.log('Connected to MongoDB');
    useMockData = false;
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    console.log('Using mock data instead');
    useMockData = true;
    initMockData();
  });

// Initialize mock data
function initMockData() {
  // Mock Users
  mockUsers = [
    {
      _id: '1',
      username: 'admin',
      email: 'admin@studysync.com',
      password: 'hashed_password_123',
      role: 'admin',
      createdAt: new Date()
    },
    {
      _id: '2',
      username: 'instructor',
      email: 'instructor@studysync.com',
      password: 'hashed_password_123',
      role: 'instructor',
      createdAt: new Date()
    },
    {
      _id: '3',
      username: 'student',
      email: 'student@studysync.com',
      password: 'hashed_password_123',
      role: 'student',
      createdAt: new Date()
    }
  ];

  // Mock Courses
  mockCourses = [
    {
      _id: '1',
      title: 'Web Development Fundamentals',
      description: 'Learn the core concepts of HTML, CSS, and JavaScript',
      instructor: '2',
      duration: 8,
      rating: 4.8,
      progress: 75,
      image: 'https://img.freepik.com/free-vector/web-development-programmer-engineering-coding-website-augmented-reality-interface-screens-developer-project-engineer-programming-software-application-design-cartoon-illustration_107791-3863.jpg'
    },
    {
      _id: '2',
      title: 'Introduction to Machine Learning',
      description: 'Fundamentals of AI and machine learning algorithms',
      instructor: '2',
      duration: 12,
      rating: 4.6,
      progress: 50,
      image: 'https://img.freepik.com/free-vector/machine-learning-concept-illustration_114360-1119.jpg'
    },
    {
      _id: '3',
      title: 'Data Science Essentials',
      description: 'Data analysis and visualization techniques',
      instructor: '2',
      duration: 10,
      rating: 4.5,
      progress: 25,
      image: 'https://img.freepik.com/free-vector/data-science-analytics-technology-concept_1150-35028.jpg'
    }
  ];
}

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

// Define Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: Number, required: true }, // in weeks
  rating: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  image: { type: String }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'studysync_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Authentication Middleware with mock data support
const authenticateToken = (req, res, next) => {
  // For development/demo purposes, skip authentication
  if (useMockData) {
    req.user = {
      id: '3',
      username: 'student',
      role: 'student'
    };
    return next();
  }

  const token = req.session.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  // Check if user is already logged in
  if (req.session && req.session.token) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (useMockData) {
      // Mock authentication for development
      const user = mockUsers.find(u => u.username === username);
      if (!user || password !== 'password123') {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET);
      req.session.token = token;
      
      return res.json({ message: 'Login successful', token });
    }
    
    // Real authentication with database
    const user = await User.findOne({ username });
    
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET);
    req.session.token = token;
    
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let user, enrolledCourses;
    
    if (useMockData) {
      user = mockUsers.find(u => u._id === req.user.id);
      enrolledCourses = mockCourses;
    } else {
      user = await User.findById(req.user.id);
      enrolledCourses = await Course.find({}).limit(5).populate('instructor', 'username');
    }
    
    // Mock data for stats
    const completedCourses = 2;
    const totalHours = 45;
    const avgRating = 4.7;
    
    // Mock data for recommended courses
    const recommendedCourses = [
      {
        _id: '4',
        title: 'Advanced JavaScript',
        instructor: 'Sarah Johnson',
        rating: 4.8,
        reviews: 128,
        image: 'https://img.freepik.com/free-vector/javascript-abstract-concept-illustration_335657-3798.jpg'
      },
      {
        _id: '5',
        title: 'AWS Certified Solutions Architect',
        instructor: 'Michael Brown',
        rating: 4.9,
        reviews: 89,
        image: 'https://img.freepik.com/free-vector/cloud-hosting-concept-illustration_114360-711.jpg'
      },
      {
        _id: '6',
        title: 'React Native Development',
        instructor: 'Jessica Lee',
        rating: 4.6,
        reviews: 57,
        image: 'https://img.freepik.com/free-vector/mobile-app-development-concept-illustration_114360-1730.jpg'
      }
    ];
    
    // Mock data for upcoming schedule
    const upcomingSchedule = [
      {
        _id: '1',
        title: 'Responsive Web Design Principles',
        instructor: 'Sarah Johnson',
        time: '2:00 PM - 3:30 PM',
        day: '15',
        month: 'Jun'
      },
      {
        _id: '2',
        title: 'ML Model Deployment Strategies',
        instructor: 'David Williams',
        time: '10:00 AM - 11:30 AM',
        day: '16',
        month: 'Jun'
      },
      {
        _id: '3',
        title: 'Python Data Visualization Masterclass',
        instructor: 'Emma Thompson',
        time: '4:00 PM - 5:30 PM',
        day: '18',
        month: 'Jun'
      }
    ];
    
    res.render('dashboard', { 
      user, 
      enrolledCourses, 
      completedCourses, 
      totalHours, 
      avgRating, 
      recommendedCourses, 
      upcomingSchedule 
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// API routes
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    let courses;
    if (useMockData) {
      courses = mockCourses;
    } else {
      courses = await Course.find({});
    }
    res.json(courses);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join a room based on user ID
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  // Handle chat messages (support both event names for compatibility)
  socket.on('chatMessage', (data) => {
    io.to(data.receiver).emit('newMessage', {
      sender: data.sender,
      message: data.message,
      timestamp: new Date()
    });
  });
  
  // Handle simpler chat message format from dashboard.ejs
  socket.on('chat message', (message) => {
    // Echo the message back with a bot response
    setTimeout(() => {
      let response = "I've received your message. How can I help you further?";
      
      // Simple keyword detection
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = "Hello! How can I assist you with your learning today?";
      } else if (lowerMessage.includes('course')) {
        response = "We have many courses available. Is there a specific subject you're interested in?";
      } else if (lowerMessage.includes('assignment')) {
        response = "I can help you with assignment questions. What's the topic?";
      } else if (lowerMessage.includes('thank')) {
        response = "You're welcome! Feel free to ask if you need anything else.";
      }
      
      socket.emit('chat message', response);
    }, 1000);
  });
  
  // Send sample notifications periodically
  setTimeout(() => {
    socket.emit('notification', {
      title: 'New Course Available',
      message: 'Check out our new React Native course!'
    });
  }, 10000);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Initialize database with some sample data if empty
const initDb = async () => {
  if (useMockData) {
    console.log('Using mock data - skipping database initialization');
    return;
  }
  
  try {
    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const admin = new User({
          username: 'admin',
          email: 'admin@studysync.com',
          password: hashedPassword,
          role: 'admin'
        });
        await admin.save();
        
        const instructor = new User({
          username: 'instructor',
          email: 'instructor@studysync.com',
          password: hashedPassword,
          role: 'instructor'
        });
        const savedInstructor = await instructor.save();
        
        // Add sample courses
        const courses = [
          {
            title: 'Web Development Fundamentals',
            description: 'Learn the core concepts of HTML, CSS, and JavaScript',
            instructor: savedInstructor._id,
            duration: 8,
            rating: 4.8,
            progress: 75,
            image: 'https://img.freepik.com/free-vector/web-development-programmer-engineering-coding-website-augmented-reality-interface-screens-developer-project-engineer-programming-software-application-design-cartoon-illustration_107791-3863.jpg'
          },
          {
            title: 'Introduction to Machine Learning',
            description: 'Fundamentals of AI and machine learning algorithms',
            instructor: savedInstructor._id,
            duration: 12,
            rating: 4.6,
            progress: 50,
            image: 'https://img.freepik.com/free-vector/machine-learning-concept-illustration_114360-1119.jpg'
          },
          {
            title: 'Data Science Essentials',
            description: 'Data analysis and visualization techniques',
            instructor: savedInstructor._id,
            duration: 10,
            rating: 4.5,
            progress: 25,
            image: 'https://img.freepik.com/free-vector/data-science-analytics-technology-concept_1150-35028.jpg'
          }
        ];
        
        await Course.insertMany(courses);
        console.log('Database initialized with sample data');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }
};

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Initialize database only if not using mock data
  if (!useMockData) {
    initDb().catch(err => {
      console.error('Database initialization error:', err);
      console.log('Continuing with server operation...');
    });
  }
}); 