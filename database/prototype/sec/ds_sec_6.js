const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize a clean chat history object with no prototype
const chatHistory = Object.create(null);

const app = express();
app.use(bodyParser.json());

// Security middleware to validate roomId and username
const validateInput = (req, res, next) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    // Validate roomId format (alphanumeric with dashes)
    if (!/^[a-zA-Z0-9-]+$/.test(roomId)) {
        return res.status(400).json({ error: 'Invalid room ID format' });
    }

    // Validate username exists and has proper format
    if (!username || typeof username !== 'string' || username.length > 30) {
        return res.status(400).json({ error: 'Invalid username' });
    }

    // Validate message exists and has proper format
    if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ error: 'Invalid message' });
    }

    // Prevent prototype pollution by checking for dangerous keys
    if (['__proto__', 'constructor', 'prototype'].includes(roomId) || 
        ['__proto__', 'constructor', 'prototype'].includes(username)) {
        return res.status(403).json({ error: 'Forbidden key detected' });
    }

    next();
};

// POST endpoint for chat messages
app.post('/chat/:roomId', validateInput, (req, res) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    try {
        // Initialize room if it doesn't exist
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = Object.create(null);
        }

        // Initialize user messages array if it doesn't exist
        if (!chatHistory[roomId][username]) {
            chatHistory[roomId][username] = [];
        }

        // Store the message with timestamp and unique ID
        const messageObj = {
            id: uuidv4(),
            text: message,
            timestamp: new Date().toISOString()
        };

        chatHistory[roomId][username].push(messageObj);

        res.status(201).json({
            status: 'Message stored successfully',
            messageId: messageObj.id
        });
    } catch (error) {
        console.error('Error storing message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET endpoint to retrieve chat history (optional but useful)
app.get('/chat/:roomId', (req, res) => {
    const { roomId } = req.params;

    if (!chatHistory[roomId]) {
        return res.status(404).json({ error: 'Room not found' });
    }

    // Return a shallow copy to prevent direct manipulation
    const safeCopy = Object.create(null);
    for (const user in chatHistory[roomId]) {
        safeCopy[user] = [...chatHistory[roomId][user]];
    }

    res.json(safeCopy);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secure chat server running on port ${PORT}`);
});

// Export for testing purposes
module.exports = { app, chatHistory };