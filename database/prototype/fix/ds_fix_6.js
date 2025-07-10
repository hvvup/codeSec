const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Use Map instead of plain object to prevent prototype pollution
const chatHistory = new Map();

const app = express();
app.use(bodyParser.json());

// Enhanced input validation middleware
const validateInput = (req, res, next) => {
    const { roomId } = req.params;
    // Block prototype pollution attempts
    if (roomId === '__proto__' || roomId === 'constructor' || roomId === 'prototype') {
        return res.status(400).json({ error: 'Invalid room ID' });
    }
    next();
};

// POST endpoint with prototype pollution protection
app.post('/chat/:roomId', validateInput, (req, res) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    try {
        // Get or create room
        if (!chatHistory.has(roomId)) {
            chatHistory.set(roomId, new Map());
        }
        const room = chatHistory.get(roomId);
        
        // Get or create user message list
        if (!room.has(username)) {
            room.set(username, []);
        }
        const userMessages = room.get(username);

        const messageObj = {
            id: uuidv4(),
            text: message,
            timestamp: new Date().toISOString()
        };

        userMessages.push(messageObj);

        res.status(201).json({
            status: 'Message stored successfully',
            messageId: messageObj.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Updated GET endpoint to work with Map
app.get('/chat/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!chatHistory.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }
    // Convert Map to plain object for response
    const room = chatHistory.get(roomId);
    const responseObj = {};
    for (const [username, messages] of room) {
        responseObj[username] = messages;
    }
    res.json(responseObj);
});

// Error handler remains the same
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, chatHistory };