// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dashboard components
    initCharts();
    initDarkMode();
    initSidebar();
    initChatbot();
    initNotifications();
    initDemoInteractivity();
});

// Initialize Charts
function initCharts() {
    // Course Completion Doughnut Chart
    const courseCompletionCtx = document.getElementById('courseCompletionChart').getContext('2d');
    const courseCompletionChart = new Chart(courseCompletionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: [
                    '#4cc9f0',  // Completed
                    '#4361ee',  // In Progress
                    '#e9ecef'   // Not Started
                ],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // Weekly Activity Bar Chart
    const weeklyActivityCtx = document.getElementById('weeklyActivityChart').getContext('2d');
    const weeklyActivityChart = new Chart(weeklyActivityCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Hours Spent',
                data: [2.5, 3.2, 1.8, 4.0, 2.7, 1.5, 0.8],
                backgroundColor: '#4361ee',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'h';
                        }
                    }
                }
            }
        }
    });
}

// Dark Mode Toggle
function initDarkMode() {
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeSwitch) {
            darkModeSwitch.checked = true;
        }
    }
    
    // Toggle dark mode
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
}

// Sidebar Toggle for Mobile
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
    
    // Close sidebar
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const isSidebar = event.target.closest('.sidebar');
        const isToggle = event.target.closest('#sidebar-toggle');
        
        if (!isSidebar && !isToggle && window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

// Chatbot Functionality
function initChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbot = document.getElementById('chatbot');
    const minimizeChatbot = document.getElementById('minimize-chatbot');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');
    
    // Welcome message after a delay
    setTimeout(() => {
        if (chatMessages) {
            addBotMessage("Hello! I'm your learning assistant. How can I help you today?");
        }
    }, 1000);
    
    // Toggle chatbot
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function() {
            chatbot.classList.add('open');
        });
    }
    
    // Minimize chatbot
    if (minimizeChatbot) {
        minimizeChatbot.addEventListener('click', function() {
            chatbot.classList.remove('open');
        });
    }
    
    // Close chatbot
    if (closeChatbot) {
        closeChatbot.addEventListener('click', function() {
            chatbot.classList.remove('open');
        });
    }
    
    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // Add user message
            addUserMessage(message);
            chatInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Process and respond to the message
            setTimeout(() => {
                processMessage(message);
            }, 1000);
        }
    }
    
    // Send on click
    sendMessage.addEventListener('click', sendMessage);
    
    // Send on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add bot message to chat
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'message-bot');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'message-user');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        typingIndicator.id = 'typingIndicator';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Process message and generate response
    function processMessage(message) {
        removeTypingIndicator();
        
        const lowerMessage = message.toLowerCase();
        let response = "I'm not sure how to help with that. Could you try asking something about your courses, assignments, or account settings?";
        
        // Simple keyword based responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            response = "Hello there! How can I assist you with your learning journey today?";
        } else if (lowerMessage.includes('course') || lowerMessage.includes('class')) {
            response = "You currently have 12 active courses. Your most engaged course is 'Web Development Fundamentals' with 75% completion.";
        } else if (lowerMessage.includes('assignment') || lowerMessage.includes('homework')) {
            response = "You have 3 pending assignments. The closest deadline is for 'JavaScript Functions Exercise' due tomorrow at 11:59 PM.";
        } else if (lowerMessage.includes('progress') || lowerMessage.includes('completion')) {
            response = "You're making great progress! Overall course completion is at 65%. Keep up the good work!";
        } else if (lowerMessage.includes('schedule') || lowerMessage.includes('upcoming')) {
            response = "Your next class is 'Advanced JavaScript Concepts' today at 3:00 PM with Prof. Sarah Johnson.";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
            response = "I can help you with course information, assignments, schedules, and general guidance. What specific help do you need?";
        } else if (lowerMessage.includes('thank')) {
            response = "You're welcome! Feel free to ask if you need any more help.";
        }
        
        addBotMessage(response);
    }
}

// Notifications
function initNotifications() {
    const notificationBadge = document.getElementById('notification-badge');
    const notificationMenu = document.getElementById('notification-menu');
    
    // Simulate notifications arriving after a delay
    setTimeout(() => {
        if (notificationBadge) {
            notificationBadge.textContent = '3';
            
            // Add animation class
            notificationBadge.classList.add('animate-notification');
            
            // Remove animation class after animation ends
            setTimeout(() => {
                notificationBadge.classList.remove('animate-notification');
            }, 500);
            
            // Update notification dropdown if exists
            if (notificationMenu) {
                const emptyNotif = notificationMenu.querySelector('.notification-item');
                if (emptyNotif && emptyNotif.textContent.includes('no new notifications')) {
                    emptyNotif.remove();
                }
                
                // Add sample notifications
                const notifications = [
                    { title: 'New Course Available', message: 'Check out our new React Native course!' },
                    { title: 'Assignment Due Soon', message: 'JavaScript Functions Exercise due in 24 hours' },
                    { title: 'Live Session Reminder', message: 'Web Design Principles starts in 1 hour' }
                ];
                
                const header = notificationMenu.querySelector('.dropdown-header');
                notifications.forEach(notification => {
                    const newNotif = document.createElement('li');
                    newNotif.className = 'dropdown-item notification-item';
                    newNotif.innerHTML = `
                        <div class="notification-content">
                            <p><strong>${notification.title}</strong></p>
                            <p>${notification.message}</p>
                            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
                        </div>
                    `;
                    
                    if (header) {
                        header.insertAdjacentElement('afterend', newNotif);
                    }
                });
            }
        }
    }, 3000);
}

// Add interactivity for demo purposes
function initDemoInteractivity() {
    // Continue learning button
    const continueButton = document.querySelector('.btn-continue-learning');
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            alert('Redirecting to your most recent course...');
        });
    }
    
    // Join class buttons
    const joinClassButtons = document.querySelectorAll('.join-class-btn');
    joinClassButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseTitle = this.closest('.recommended-course').querySelector('h6').textContent;
            alert(`Joining class: ${courseTitle}`);
            this.textContent = 'Enrolled';
            this.disabled = true;
        });
    });
    
    // Set reminder buttons
    const reminderButtons = document.querySelectorAll('.set-reminder-btn');
    reminderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const scheduleTitle = this.closest('.schedule-details').querySelector('h6').textContent;
            alert(`Reminder set for: ${scheduleTitle}`);
            this.innerHTML = '<i class="fas fa-check"></i> Reminder Set';
            this.disabled = true;
        });
    });
    
    // Continue buttons in course table
    const courseButtons = document.querySelectorAll('.table .btn-primary');
    courseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseRow = this.closest('tr');
            const courseTitle = courseRow.querySelector('h6').textContent;
            alert(`Loading course: ${courseTitle}`);
        });
    });
}

// Add CSS animation for notification bell
const style = document.createElement('style');
style.textContent = `
    @keyframes bell-ring {
        0% { transform: rotate(0); }
        20% { transform: rotate(15deg); }
        40% { transform: rotate(-15deg); }
        60% { transform: rotate(7deg); }
        80% { transform: rotate(-7deg); }
        100% { transform: rotate(0); }
    }
    
    .animate-notification {
        animation: bell-ring 0.5s ease;
    }
`;
document.head.appendChild(style); 