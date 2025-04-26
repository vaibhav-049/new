# Learning Platform Dashboard - Technical Implementation

This document provides technical details on the implementation of the learning platform dashboard.

## Tech Stack

- **Frontend**: HTML/EJS, CSS, JavaScript 
- **Libraries**: Chart.js for data visualization
- **Responsive Framework**: Custom CSS with CSS variables

## File Structure

```
├── public/
│   ├── js/
│   │   └── dashboard.js     # Dashboard functionality
│   │
│   ├── css/
│   │   └── style.css        # Dashboard styling
│   │
│   └── img/                 # Dashboard assets
│
└── views/
    └── dashboard.ejs        # Dashboard HTML template
```

## Dashboard Components

### 1. EJS Template (`dashboard.ejs`)

The dashboard is structured into several key sections:

- **Navigation Bar**: Contains the brand, search functionality, and user menu
- **Sidebar**: Navigation links to different platform areas
- **Main Content**: Contains all the dashboard widgets and cards
  - Welcome Section with personalized greeting
  - Statistics and Key Metrics
  - Course Progress Charts
  - Active Course Cards
  - Upcoming Classes
- **Chatbot**: Collapsible chat assistant

### 2. JavaScript Functionality (`dashboard.js`)

#### Chart Initialization
```javascript
function initializeCharts() {
    // Course completion chart (Doughnut)
    const courseCompletionChart = new Chart(
        document.getElementById('courseCompletionChart'),
        {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(201, 203, 207, 0.7)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(201, 203, 207)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        }
    );

    // Weekly activity chart (Bar)
    const weeklyActivityChart = new Chart(
        document.getElementById('weeklyActivityChart'),
        {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Hours Spent',
                    data: [2.5, 3.2, 1.8, 4.0, 2.7, 1.5, 0.8],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        }
    );
}
```

#### Chatbot Implementation
The chatbot provides keyword-based responses:

```javascript
function chatbotResponse(message) {
    const lowercaseMsg = message.toLowerCase();
    
    // Response logic based on keywords
    if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi')) {
        return "Hello! How can I assist with your learning today?";
    } else if (lowercaseMsg.includes('course') || lowercaseMsg.includes('certificate')) {
        return "Your current course progress is 65%. Keep going! You're doing great.";
    } else if (lowercaseMsg.includes('class') || lowercaseMsg.includes('schedule')) {
        return "You have an upcoming class on Advanced JavaScript this Thursday at 7 PM.";
    } else if (lowercaseMsg.includes('progress') || lowercaseMsg.includes('learning')) {
        return "You've completed 12 modules this month! That's 30% more than last month.";
    } else if (lowercaseMsg.includes('help') || lowercaseMsg.includes('support')) {
        return "I can help with course information, schedules, and learning tips. What do you need?";
    } else {
        return "I'm not sure I understand. Try asking about your courses, schedule, or learning progress.";
    }
}
```

#### Dark Mode Toggle
Dark mode implementation using localStorage:

```javascript
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const currentTheme = localStorage.getItem('theme') || 
                         (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Toggle theme when switch is clicked
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}
```

### 3. CSS Structure (`style.css`)

The CSS implements a responsive design with CSS variables for theming:

#### CSS Variables
```css
:root {
    --primary-color: #4a6cf7;
    --primary-dark: #3a56c6;
    --secondary-color: #6c757d;
    --light-bg: #f8f9fa;
    --dark-bg: #222831;
    --text-color: #333;
    --text-dark: #f1f1f1;
    --border-color: #e1e5ea;
    --border-dark: #343a40;
    --card-bg: #ffffff;
    --card-bg-dark: #2d333b;
}

.dark-mode {
    --text-color: var(--text-dark);
    --border-color: var(--border-dark);
    --card-bg: var(--card-bg-dark);
    background-color: var(--dark-bg);
}
```

#### Responsive Design
The dashboard is built with a mobile-first approach:

```css
/* Base styles for mobile */
.dashboard {
    display: flex;
    flex-direction: column;
}

.sidebar {
    position: fixed;
    left: -250px;
    width: 250px;
    height: 100vh;
    transition: left 0.3s ease;
    z-index: 1000;
}

.sidebar.active {
    left: 0;
}

.main-content {
    margin-left: 0;
    width: 100%;
    transition: margin-left 0.3s ease;
}

/* Tablet */
@media (min-width: 768px) {
    .dashboard {
        flex-direction: row;
    }
    
    .sidebar {
        position: relative;
        left: 0;
        width: 200px;
    }
    
    .main-content {
        margin-left: 200px;
        width: calc(100% - 200px);
    }
}

/* Desktop */
@media (min-width: 992px) {
    .sidebar {
        width: 250px;
    }
    
    .main-content {
        margin-left: 250px;
        width: calc(100% - 250px);
    }
}
```

## Implementation Notes

### Browser Compatibility
- CSS Grid and Flexbox are used for layouts (requires modern browsers)
- localStorage is used for theme persistence
- Chart.js requires browsers that support Canvas API

### Performance Considerations
- Charts are initialized only when the page is loaded
- Event listeners use event delegation where possible
- CSS transitions are used for animations instead of JavaScript

### Accessibility
- Color contrast ratios meet WCAG AA standards
- Keyboard navigation is supported for all interactive elements
- ARIA attributes are used for the chatbot and other dynamic content

## Development Workflow

1. Modify EJS templates in the `views` directory
2. Update styling in `public/css/style.css`
3. Add functionality in `public/js/dashboard.js`
4. Test changes across different viewport sizes

## Future Technical Improvements

1. **Code Modularization**: Split dashboard.js into separate modules
2. **API Integration**: Replace static data with API endpoints
3. **Testing Framework**: Add Jest or Mocha tests for JavaScript functions
4. **State Management**: Implement a lightweight state management solution
5. **Build Process**: Add minification and bundling for production 