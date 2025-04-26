document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Form validation
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form data
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            
            // Simple validation
            if (!email || !password) {
                showAlert('Please fill in all fields', 'danger');
                return;
            }
            
            // Call the login API
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    // Store token in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    showAlert(data.msg || 'Login failed. Please check your credentials.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred. Please try again later.', 'danger');
            });
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form data
            const formData = new FormData(signupForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            // Simple validation
            if (!name || !email || !password || !confirmPassword) {
                showAlert('Please fill in all fields', 'danger');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'danger');
                return;
            }
            
            if (password.length < 6) {
                showAlert('Password must be at least 6 characters long', 'danger');
                return;
            }
            
            // Call the register API
            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    // Store token in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    showAlert(data.msg || 'Registration failed. Please try again.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred. Please try again later.', 'danger');
            });
        });
    }

    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-toggled');
            document.querySelector('.sidebar').classList.toggle('d-none');
        });
    }

    // Toggle dark mode
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check for saved theme preference or respect OS theme setting
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') !== 'disabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }

        // Dark mode toggle event
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }

    // Chatbot functionality
    initChatbot();

    // Check if user is logged in
    checkAuth();
});

// Initialize the chatbot functionality
function initChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotForm = document.getElementById('chatbotForm');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotMessages = document.getElementById('chatbotMessages');

    // Welcome message
    addBotMessage("Hello! I'm your learning assistant. How can I help you today?", [
        "Course recommendations", 
        "Assignment help", 
        "Study tips", 
        "Technical support"
    ]);

    // Toggle chatbot visibility
    if (chatbotToggle && chatbotContainer && chatbotClose) {
        chatbotToggle.addEventListener('click', function() {
            chatbotContainer.style.display = 'flex';
            chatbotInput.focus();
        });

        chatbotClose.addEventListener('click', function() {
            chatbotContainer.style.display = 'none';
        });
    }

    // Handle form submission
    if (chatbotForm) {
        chatbotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatbotInput.value.trim();
            
            if (message) {
                // Add user message
                addUserMessage(message);
                
                // Clear input
                chatbotInput.value = '';
                
                // Process message and generate response
                processChatbotMessage(message);
            }
        });
    }

    // Handle related topic clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('related-topic')) {
            const topic = e.target.innerText;
            addUserMessage(topic);
            processChatbotMessage(topic);
        }
    });
}

// Add a user message to the chat
function addUserMessage(message) {
    const chatbotMessages = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chatbot-message', 'user-message');
    
    messageElement.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    
    chatbotMessages.appendChild(messageElement);
    scrollChatToBottom();
}

// Add a bot message to the chat
function addBotMessage(message, relatedTopics = []) {
    const chatbotMessages = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chatbot-message', 'bot-message');
    
    let relatedTopicsHtml = '';
    if (relatedTopics.length > 0) {
        relatedTopicsHtml = '<div class="related-topics">';
        relatedTopics.forEach(topic => {
            relatedTopicsHtml += `<span class="related-topic">${escapeHtml(topic)}</span>`;
        });
        relatedTopicsHtml += '</div>';
    }
    
    messageElement.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
        ${relatedTopicsHtml}
    `;
    
    chatbotMessages.appendChild(messageElement);
    scrollChatToBottom();
}

// Process the user message and generate a response
function processChatbotMessage(message) {
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate API call delay
    setTimeout(() => {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Generate response based on message content
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('course') && lowerMessage.includes('recommend')) {
            addBotMessage("Based on your learning history, I recommend 'Advanced Data Science' and 'Web Development with React'. Would you like more details about these courses?", [
                "Tell me about Data Science", 
                "Tell me about React", 
                "Show all recommendations"
            ]);
        } 
        else if (lowerMessage.includes('assignment') || lowerMessage.includes('homework')) {
            addBotMessage("I see you have 3 pending assignments. The closest deadline is for 'JavaScript Fundamentals' due in 2 days. Would you like help with this assignment?", [
                "Help with JavaScript", 
                "Show all assignments", 
                "Extend deadline"
            ]);
        }
        else if (lowerMessage.includes('study') || lowerMessage.includes('tips')) {
            addBotMessage("Here are some study tips: create a dedicated study space, use the Pomodoro technique (25 minutes focus, 5 minutes break), and join study groups for collaborative learning. Would you like more specific tips?", [
                "Pomodoro technique", 
                "Study groups", 
                "Time management"
            ]);
        }
        else if (lowerMessage.includes('technical') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
            addBotMessage("For technical support, you can: 1) Check our FAQ section, 2) Contact the IT helpdesk at support@learning.com, or 3) Join our community forum. What would you like to do?", [
                "Go to FAQ", 
                "Contact helpdesk", 
                "Join forum"
            ]);
        }
        else if (lowerMessage.includes('data science')) {
            addBotMessage("Our Advanced Data Science course covers machine learning, statistical analysis, and big data processing with Python and R. It's a 12-week course with 4.9/5 star rating from previous students.", [
                "Enroll now", 
                "View syllabus", 
                "See prerequisites"
            ]);
        }
        else if (lowerMessage.includes('react')) {
            addBotMessage("The Web Development with React course teaches modern frontend development using React.js, Redux, and related technologies. This 8-week course includes hands-on projects and has a 4.8/5 star rating.", [
                "Enroll now", 
                "View syllabus", 
                "See prerequisites"
            ]);
        }
        else {
            addBotMessage("I'm here to help with course recommendations, assignment assistance, study tips, and technical support. What specific help do you need today?", [
                "Course recommendations", 
                "Assignment help", 
                "Study tips", 
                "Technical support"
            ]);
        }
    }, 1000);
}

// Show typing indicator
function showTypingIndicator() {
    const chatbotMessages = document.getElementById('chatbotMessages');
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('chatbot-message', 'bot-message', 'typing-indicator');
    
    typingIndicator.innerHTML = `
        <div class="message-content">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    
    chatbotMessages.appendChild(typingIndicator);
    scrollChatToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll chat to the bottom
function scrollChatToBottom() {
    const chatbotMessages = document.getElementById('chatbotMessages');
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Chart initialization for the dashboard
function initCharts() {
    // Course completion chart
    const courseCompletionCtx = document.getElementById('courseCompletionChart');
    if (courseCompletionCtx) {
        new Chart(courseCompletionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [8, 5, 3],
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.8)',
                        'rgba(72, 149, 239, 0.8)',
                        'rgba(108, 117, 125, 0.3)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Weekly activity chart
    const weeklyActivityCtx = document.getElementById('weeklyActivityChart');
    if (weeklyActivityCtx) {
        new Chart(weeklyActivityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Hours Spent',
                    data: [2.5, 3, 4.5, 2, 3.5, 5, 1.5],
                    backgroundColor: 'rgba(67, 97, 238, 0.8)',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 6
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Subject performance chart
    const subjectPerformanceCtx = document.getElementById('subjectPerformanceChart');
    if (subjectPerformanceCtx) {
        new Chart(subjectPerformanceCtx, {
            type: 'radar',
            data: {
                labels: ['Programming', 'Design', 'Mathematics', 'Data Science', 'Business', 'Communication'],
                datasets: [{
                    label: 'Your Skills',
                    data: [85, 70, 60, 75, 65, 80],
                    backgroundColor: 'rgba(67, 97, 238, 0.2)',
                    borderColor: 'rgba(67, 97, 238, 0.8)',
                    pointBackgroundColor: 'rgba(67, 97, 238, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(67, 97, 238, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (token) {
        // Update UI for logged in user
        updateAuthUI(true);
        
        // Fetch user data
        fetch('/api/auth/me', {
            headers: {
                'x-auth-token': token
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Auth failed');
            }
            return response.json();
        })
        .then(user => {
            // Update user-specific elements
            updateUserElements(user);
        })
        .catch(error => {
            console.error('Auth error:', error);
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI(false);
        });
    } else {
        updateAuthUI(false);
    }
}

// Update UI based on auth status
function updateAuthUI(isLoggedIn) {
    const authButtons = document.querySelector('.navbar .d-flex');
    
    if (authButtons) {
        if (isLoggedIn) {
            // Get user data
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            authButtons.innerHTML = `
                <div class="dropdown">
                    <button class="btn dropdown-toggle d-flex align-items-center" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="${user.avatar || '/images/default-avatar.png'}" class="rounded-circle me-2" width="30" height="30" alt="Profile">
                        <span>${user.name || 'User'}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="/dashboard">Dashboard</a></li>
                        <li><a class="dropdown-item" href="/profile">Profile</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                    </ul>
                </div>
            `;
            
            // Add logout functionality
            document.getElementById('logoutBtn').addEventListener('click', function(event) {
                event.preventDefault();
                
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Redirect to home page
                window.location.href = '/';
            });
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline-light me-2" type="button" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
                <button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#signupModal">Sign Up</button>
            `;
        }
    }
}

// Update user-specific elements
function updateUserElements(user) {
    // This can be expanded based on the specific UI elements that need to be updated
    console.log('User data loaded:', user);
} 