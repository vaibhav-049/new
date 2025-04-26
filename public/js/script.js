// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the chatbot
    initChatbot();
    
    // Initialize progress bars on dashboard
    initProgressBars();
    
    // Initialize tooltips
    initTooltips();
});

// Chatbot Functionality
function initChatbot() {
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotClose = document.querySelector('.chatbot-close');
    const chatForm = document.querySelector('.chatbot-input-form');
    const chatInput = document.querySelector('.chatbot-input');
    const chatMessages = document.querySelector('.chatbot-messages');
    
    // Sample chatbot responses for demonstration
    const responses = {
        "hello": "Hi there! How can I help you with your online learning today?",
        "hi": "Hello! How can I assist you with your courses?",
        "help": "I can help you with course information, technical issues, assignment queries, and more. What do you need assistance with?",
        "course": "We have various courses available. Are you looking for a specific subject or topic?",
        "assignment": "If you're having trouble with an assignment, I can guide you through the process or connect you with a tutor.",
        "live class": "Our live classes are interactive sessions with instructors. You can find the schedule on your dashboard under 'Upcoming Live Sessions'.",
        "certificate": "Certificates are awarded upon successful completion of courses. You can view and download your certificates from the 'Certificates' section.",
        "payment": "We accept various payment methods including credit cards, PayPal, and bank transfers. Would you like information about our payment plans?",
        "refund": "Our refund policy allows for full refunds within 7 days of purchase if you're not satisfied with the course. Please check our terms for more details.",
        "contact": "You can reach our support team at support@eduplatform.com or call us at (123) 456-7890 during business hours.",
        "technical issue": "I'm sorry you're experiencing technical difficulties. Could you describe the issue in more detail so I can help troubleshoot?"
    };
    
    // Related topics for suggestions
    const relatedTopics = {
        "course": ["course recommendations", "course difficulty", "prerequisites"],
        "assignment": ["deadline extension", "grading policy", "submission format"],
        "payment": ["payment plans", "discounts", "subscription"],
        "technical issue": ["login problems", "video playback", "download issues"]
    };
    
    // Toggle chatbot visibility
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function() {
            if (chatbotContainer) {
                chatbotContainer.style.display = chatbotContainer.style.display === 'none' || chatbotContainer.style.display === '' ? 'flex' : 'none';
                if (chatbotContainer.style.display === 'flex') {
                    // Add initial message when chatbot opens
                    if (chatMessages.children.length === 0) {
                        addBotMessage("Hi there! 👋 I'm your learning assistant. How can I help you today?");
                        
                        // Add some common topic suggestions
                        addTopicSuggestions([
                            "course information", 
                            "assignment help", 
                            "technical support",
                            "payment options"
                        ]);
                    }
                }
            }
        });
    }
    
    // Close chatbot
    if (chatbotClose) {
        chatbotClose.addEventListener('click', function() {
            if (chatbotContainer) {
                chatbotContainer.style.display = 'none';
            }
        });
    }
    
    // Handle form submission
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                addUserMessage(message);
                chatInput.value = '';
                
                // Process the message and respond after a small delay
                setTimeout(() => {
                    processChatMessage(message);
                }, 500);
            }
        });
    }
    
    // Add a user message to the chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        
        contentElement.appendChild(paragraph);
        messageElement.appendChild(contentElement);
        
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Add a bot message to the chat
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        
        contentElement.appendChild(paragraph);
        messageElement.appendChild(contentElement);
        
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Add topic suggestions
    function addTopicSuggestions(topics) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = "Here are some topics I can help with:";
        
        const topicsContainer = document.createElement('div');
        topicsContainer.className = 'related-topics';
        
        topics.forEach(topic => {
            const topicElement = document.createElement('span');
            topicElement.className = 'topic-tag';
            topicElement.textContent = topic;
            topicElement.addEventListener('click', function() {
                addUserMessage(topic);
                setTimeout(() => {
                    processChatMessage(topic);
                }, 500);
            });
            topicsContainer.appendChild(topicElement);
        });
        
        contentElement.appendChild(paragraph);
        contentElement.appendChild(topicsContainer);
        messageElement.appendChild(contentElement);
        
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Process user messages and generate appropriate responses
    function processChatMessage(message) {
        const lowerMessage = message.toLowerCase();
        let responded = false;
        
        // Check for exact matches in our responses object
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                addBotMessage(response);
                
                // Add related topics if available
                if (relatedTopics[key]) {
                    addTopicSuggestions(relatedTopics[key]);
                }
                
                responded = true;
                break;
            }
        }
        
        // If no matches were found, provide a default response
        if (!responded) {
            addBotMessage("I'm not sure I understand. Could you rephrase your question or choose one of these common topics?");
            addTopicSuggestions([
                "course information", 
                "assignment help", 
                "technical support",
                "payment options"
            ]);
        }
    }
}

// Initialize progress bars
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(progressBar => {
        const value = progressBar.getAttribute('aria-valuenow');
        progressBar.style.width = value + '%';
    });
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Course enrollment function
function enrollCourse(courseId) {
    // This would typically involve an AJAX request to the server
    console.log(`Enrolling in course ID: ${courseId}`);
    
    // For demonstration, show success message
    const alertHTML = `
        <div class="alert alert-success alert-dismissible fade show alert-floating" role="alert">
            Successfully enrolled in the course!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert-floating');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Live session registration function
function registerSession(sessionId) {
    // This would typically involve an AJAX request to the server
    console.log(`Registering for session ID: ${sessionId}`);
    
    // For demonstration, show success message
    const alertHTML = `
        <div class="alert alert-success alert-dismissible fade show alert-floating" role="alert">
            Successfully registered for the live session!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert-floating');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Function to handle dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Check user's saved preference for dark mode
function checkDarkModePreference() {
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    checkDarkModePreference();
    
    // Add event listener to dark mode toggle button if it exists
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}); 