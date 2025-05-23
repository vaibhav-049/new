# StudySync - Real Time Learning Platform

A modern online learning platform dashboard built with Node.js, Express, EJS, and MongoDB. The dashboard features a clean, responsive UI with dark mode support, interactive charts, a chatbot assistant, and real-time notifications.

## Features

- **User Authentication:** Login system with JWT authentication
- **Dashboard Overview:** Stats, charts, and course progress visualization
- **Course Management:** View enrolled courses and recommended courses
- **Interactive Elements:** Chatbot assistance, notifications, and schedule reminders
- **Real-time Updates:** Socket.IO integration for live notifications and chat
- **Dark Mode:** Toggle between light and dark themes
- **Responsive Design:** Optimized for all screen sizes

## Tech Stack

- **Frontend:**
  - EJS (Embedded JavaScript templates)
  - CSS with custom variables for theming
  - Bootstrap 5 for layout and components
  - Chart.js for data visualization
  - FontAwesome for icons

- **Backend:**
  - Node.js with Express
  - MongoDB with Mongoose (with mock data fallback)
  - Socket.IO for real-time communication
  - JSON Web Tokens (JWT) for authentication

## Project Structure

```
/
├── public/               # Static assets
│   ├── css/              # Stylesheets
│   │   └── dashboard.css # Main dashboard styles
│   ├── js/               # Client-side JavaScript
│   │   └── dashboard.js  # Dashboard functionality
│   └── images/           # Image assets
├── views/                # EJS templates
│   ├── dashboard.ejs     # Main dashboard view
│   ├── login.ejs         # Login page
│   └── error.ejs         # Error page
├── server.js             # Main application file
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (optional - falls back to mock data)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/studysync.git
cd studysync
```

2. Install dependencies
```bash
npm install
```

3. Start the application
```bash
npm start
```

4. Access the application at `http://localhost:3000`

### Development Mode

To run the application in development mode with auto-restart:
```bash
npm run dev
```

## Dashboard Pages

1. **Main Dashboard:** Overview of your learning progress and statistics
2. **Courses:** View and manage your enrolled courses
3. **Schedule:** Upcoming classes and sessions
4. **Tasks:** Pending assignments and projects
5. **Messages:** Communication with instructors and peers
6. **Settings:** Profile and preference management

## Authentication

The application includes a login system. For demo purposes, you can use:
- **Username:** student
- **Password:** password123

## License

This project is licensed under the ISC License. #   n e w  
 #   n e w  
 