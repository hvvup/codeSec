const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Create a prototype-less object to prevent prototype pollution
const chatHistory = Object.create(null);

const app = express();
app.use(bodyParser.json());

// Improved validation middleware that checks for prototype pollution attempts
const validateInput = (req, res, next) => {
    const { roomId } = req.params;
    
    // Check for dangerous property names that could lead to prototype pollution
    const isDangerousProperty = (prop) => {
        return ['__proto__', 'constructor', 'prototype'].includes(prop);
    };

    if (isDangerousProperty(roomId)) {
        return res.status(400).json({ error: 'Invalid room ID' });
    }

    next();
};

app.post('/chat/:roomId', validateInput, (req, res) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    try {
        // Safe property assignment using Object.create(null) for chatHistory
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = Object.create(null);
        }
        if (!chatHistory[roomId][username]) {
            chatHistory[roomId][username] = [];
        }

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
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/chat/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!chatHistory[roomId]) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(chatHistory[roomId]);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, chatHistory };