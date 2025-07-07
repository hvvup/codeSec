const express = require('express');
const sanitizeHtml = require('sanitize-html');
const { escape } = require('html-escaper');

// Initialize Express application
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});

// HTML template function with proper escaping
const getHtmlResponse = (title, content) => {
    // All variables are properly escaped before insertion
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escape(title)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .message-container {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin-top: 20px;
            background-color: #f9f9f9;
        }
        .message-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>Secure Message Display</h1>
    <div class="message-container">
        <div class="message-label">Your Message:</div>
        <div class="message-content">${content}</div>
    </div>
    <footer style="margin-top: 30px; font-size: 0.8em; color: #777;">
        This content is securely sanitized and escaped to prevent XSS attacks.
    </footer>
</body>
</html>`;
};

// Sanitization configuration
const sanitizeOptions = {
    allowedTags: ['p', 'strong', 'em'],
    allowedAttributes: {},
    textFilter: (text) => {
        // Additional text filtering if needed
        return text;
    }
};

// GET endpoint for /response
app.get('/response', (req, res) => {
    try {
        // Get message from query parameter
        const userMessage = req.query.msg || 'No message provided';
        
        // First escape the content to prevent XSS
        const escapedMessage = escape(userMessage);
        
        // Then sanitize to allow only permitted HTML tags
        const sanitizedMessage = sanitizeHtml(escapedMessage, sanitizeOptions);
        
        // Send the response with properly escaped and sanitized content
        res.send(getHtmlResponse('Message Display', sanitizedMessage));
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send(getHtmlResponse('Error', 'An error occurred while processing your request.'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send(getHtmlResponse('Server Error', 'A server error occurred.'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running securely on http://localhost:${PORT}`);
});

// Export for testing purposes
module.exports = app;