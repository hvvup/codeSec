const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const chatHistory = new Map(); // Changed to Map to prevent prototype pollution

const app = express();
app.use(bodyParser.json());

const validateInput = (req, res, next) => {
    const { roomId } = req.params;
    // Prevent prototype pollution by blocking reserved keys
    if (roomId === '__proto__' || roomId === 'constructor' || roomId === 'prototype') {
        return res.status(403).json({ error: 'Invalid room ID' });
    }
    next();
};

app.post('/chat/:roomId', validateInput, (req, res) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    try {
        // Get or create room data using Map
        let roomData = chatHistory.get(roomId);
        if (!roomData) {
            roomData = {};
            chatHistory.set(roomId, roomData);
        }

        // Get or create user messages array
        if (!roomData[username]) {
            roomData[username] = [];
        }

        const messageObj = {
            id: uuidv4(),
            text: message,
            timestamp: new Date().toISOString()
        };

        roomData[username].push(messageObj);

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
    const roomData = chatHistory.get(roomId);
    if (!roomData) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(roomData);
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