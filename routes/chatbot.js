const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');

// Define chatbot responses
const responses = {
  welcome: "Welcome to our online learning platform! How can I help you today?",
  
  // Authentication and account
  login: "To login, click on the 'Login' button at the top right of the page. You can use your email/password or sign in with Google, GitHub, or Microsoft.",
  signup: "To sign up, click on the 'Sign Up' button at the top right of the page. You can create an account with email/password or sign up with Google, GitHub, or Microsoft.",
  forgotPassword: "If you forgot your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to reset your password.",
  account: "You can manage your account by clicking on your profile picture at the top right, then selecting 'Account Settings'.",
  
  // Courses
  findCourses: "You can browse our courses by using the search bar or by navigating to the 'Courses' page. You can filter courses by category, level, and other criteria.",
  enrollCourse: "To enroll in a course, go to the course page and click the 'Enroll' button. Some courses may require payment.",
  courseProgress: "Your course progress is tracked automatically as you complete lectures and quizzes. You can view your progress on your dashboard or on the course page.",
  certificates: "Certificates are awarded when you complete a course. You can find your certificates in your profile under 'Certificates'.",
  
  // Live classes
  liveClasses: "Live classes are interactive sessions with instructors. You can see upcoming live classes on your dashboard or on the course page.",
  joinLive: "To join a live class, go to the live class page at the scheduled time and click 'Join'. Make sure your camera and microphone are working.",
  superchat: "Superchat allows you to highlight your messages during live sessions. Click on the '$' icon in the chat and choose an amount to send with your message.",
  recordedLectures: "Recorded lectures from previous live classes can be found in the course content section, marked as 'Recording'.",
  
  // Quizzes
  quizzes: "Quizzes test your knowledge of the course material. You can find quizzes in the course content section.",
  takeQuiz: "To take a quiz, click on the quiz in the course content. Read the instructions, answer the questions, and submit.",
  quizResults: "Quiz results are shown immediately after submission. You can review your answers and see explanations for correct answers.",
  
  // Dashboard
  dashboard: "Your dashboard shows your enrolled courses, upcoming live classes, recent notifications, and progress statistics.",
  
  // Technical issues
  technicalIssues: "For technical issues, try refreshing the page, clearing your browser cache, or using a different browser. If the issue persists, contact support.",
  browserSupport: "Our platform works best on the latest versions of Chrome, Firefox, Safari, and Edge.",
  
  // Other
  contact: "You can contact us by sending an email to support@learningplatform.com or by using the 'Contact' form in the footer.",
  defaultResponse: "I don't have information about that yet. Please try asking something else or contact support for more help."
};

// Help topics for guide
const helpTopics = [
  { id: 'login', title: 'How to Login' },
  { id: 'signup', title: 'How to Sign Up' },
  { id: 'findCourses', title: 'Finding Courses' },
  { id: 'enrollCourse', title: 'Enrolling in a Course' },
  { id: 'liveClasses', title: 'Live Classes' },
  { id: 'superchat', title: 'Using Superchat' },
  { id: 'quizzes', title: 'Taking Quizzes' },
  { id: 'dashboard', title: 'Using Your Dashboard' },
  { id: 'technicalIssues', title: 'Technical Issues' },
  { id: 'contact', title: 'Contacting Support' }
];

// @route   GET api/chatbot/topics
// @desc    Get all help topics
// @access  Public
router.get('/topics', (req, res) => {
  res.json(helpTopics);
});

// Keyword to response mapping
const keywordMap = {
  'login': 'login',
  'sign in': 'login',
  'signin': 'login',
  'log in': 'login',
  'sign up': 'signup',
  'signup': 'signup',
  'register': 'signup',
  'create account': 'signup',
  'forgot password': 'forgotPassword',
  'reset password': 'forgotPassword',
  'change password': 'forgotPassword',
  'find course': 'findCourses',
  'search course': 'findCourses',
  'browse course': 'findCourses',
  'enroll': 'enrollCourse',
  'join course': 'enrollCourse',
  'buy course': 'enrollCourse',
  'progress': 'courseProgress',
  'track progress': 'courseProgress',
  'certificate': 'certificates',
  'live class': 'liveClasses',
  'join live': 'joinLive',
  'attend live': 'joinLive',
  'superchat': 'superchat',
  'donate': 'superchat',
  'recording': 'recordedLectures',
  'recorded lecture': 'recordedLectures',
  'recorded class': 'recordedLectures',
  'quiz': 'quizzes',
  'test': 'quizzes',
  'assessment': 'quizzes',
  'take quiz': 'takeQuiz',
  'quiz result': 'quizResults',
  'score': 'quizResults',
  'dashboard': 'dashboard',
  'home': 'dashboard',
  'profile': 'dashboard',
  'technical': 'technicalIssues',
  'issue': 'technicalIssues',
  'problem': 'technicalIssues',
  'bug': 'technicalIssues',
  'error': 'technicalIssues',
  'browser': 'browserSupport',
  'chrome': 'browserSupport',
  'firefox': 'browserSupport',
  'safari': 'browserSupport',
  'edge': 'browserSupport',
  'contact': 'contact',
  'support': 'contact',
  'help': 'contact',
  'hello': 'welcome',
  'hi': 'welcome',
  'hey': 'welcome',
  'greetings': 'welcome'
};

// @route   POST api/chatbot/message
// @desc    Send message to chatbot
// @access  Public
router.post('/message', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ msg: 'Message is required' });
    }
    
    // Convert message to lowercase for matching
    const lowercaseMessage = message.toLowerCase();
    
    // Find matching keyword
    let responseKey = 'defaultResponse';
    
    for (const [keyword, key] of Object.entries(keywordMap)) {
      if (lowercaseMessage.includes(keyword)) {
        responseKey = key;
        break;
      }
    }
    
    // Get response
    const response = responses[responseKey] || responses.defaultResponse;
    
    // Suggest related topics
    const relatedTopics = helpTopics
      .filter(topic => topic.id !== responseKey)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    res.json({
      message: response,
      relatedTopics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/chatbot/help/:topic
// @desc    Get help for specific topic
// @access  Public
router.get('/help/:topic', (req, res) => {
  try {
    const { topic } = req.params;
    
    // Check if topic exists
    if (!responses[topic]) {
      return res.status(404).json({ msg: 'Help topic not found' });
    }
    
    // Get response for topic
    const response = responses[topic];
    
    // Find topic object for title
    const topicObj = helpTopics.find(t => t.id === topic) || { title: topic };
    
    res.json({
      title: topicObj.title,
      message: response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 