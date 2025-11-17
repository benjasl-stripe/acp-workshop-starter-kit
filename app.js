// Configuration
let LAMBDA_ENDPOINT = '';
let WORKSHOP_SECRET = '';
let messages = [];

// Load configuration from localStorage
function loadConfig() {
    LAMBDA_ENDPOINT = localStorage.getItem('lambdaEndpoint') || '';
    WORKSHOP_SECRET = localStorage.getItem('workshopSecret') || '';
    
    if (LAMBDA_ENDPOINT) {
        document.getElementById('lambdaEndpoint').value = LAMBDA_ENDPOINT;
    }
    if (WORKSHOP_SECRET) {
        document.getElementById('workshopSecret').value = WORKSHOP_SECRET;
    }
}

// Save configuration to localStorage
function saveConfig() {
    LAMBDA_ENDPOINT = document.getElementById('lambdaEndpoint').value.trim();
    WORKSHOP_SECRET = document.getElementById('workshopSecret').value.trim();
    
    localStorage.setItem('lambdaEndpoint', LAMBDA_ENDPOINT);
    localStorage.setItem('workshopSecret', WORKSHOP_SECRET);
    
    alert('Configuration saved! ✅');
}

// Initialize
loadConfig();

// Handle Enter key
document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send message function
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!LAMBDA_ENDPOINT || !WORKSHOP_SECRET) {
        showError('Please configure your Lambda endpoint and Workshop secret in the settings below.');
        return;
    }
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addMessage('user', message);
    
    // Add message to conversation history
    messages.push({ role: 'user', content: message });
    
    // Disable send button
    toggleSendButton(false);
    
    try {
        // Call Lambda endpoint
        const response = await fetch(LAMBDA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Workshop-Secret': WORKSHOP_SECRET
            },
            body: JSON.stringify({
                messages: messages,
                workshopContext: buildWorkshopContext(),
                currentPage: 'AI Chat Test',
                currentUrl: window.location.href
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const assistantMessage = data.content;
        
        // Add assistant message to chat
        addMessage('assistant', assistantMessage, data.cached);
        
        // Add to conversation history
        messages.push({ role: 'assistant', content: assistantMessage });
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to get response: ${error.message}`);
    } finally {
        toggleSendButton(true);
    }
}

// Add message to chat UI
function addMessage(role, content, cached = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (role === 'assistant') {
        // Parse markdown-like formatting
        contentDiv.innerHTML = formatMessage(content);
        if (cached) {
            const cacheLabel = document.createElement('div');
            cacheLabel.style.fontSize = '0.8em';
            cacheLabel.style.color = '#888';
            cacheLabel.style.marginTop = '5px';
            cacheLabel.textContent = '⚡ Cached response';
            contentDiv.appendChild(cacheLabel);
        }
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Simple markdown-like formatting
function formatMessage(text) {
    // Code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error message
function showError(message) {
    const chatContainer = document.getElementById('chatContainer');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `❌ ${message}`;
    chatContainer.appendChild(errorDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Toggle send button state
function toggleSendButton(enabled) {
    const button = document.getElementById('sendButton');
    const buttonText = document.getElementById('buttonText');
    const spinner = document.getElementById('buttonSpinner');
    
    button.disabled = !enabled;
    buttonText.style.display = enabled ? 'inline' : 'none';
    spinner.style.display = enabled ? 'none' : 'inline';
}

// Build workshop context (you can customize this)
function buildWorkshopContext() {
    return `You are a helpful AI assistant for a workshop.

CURRENT PAGE CONTEXT:
The user is testing the AI chat interface.

Please provide helpful, concise answers to user questions.
Use code examples with proper markdown formatting when relevant.`;
}

