const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const chatHistory = {};

const app = express();
app.use(bodyParser.json());

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isSafeKey(key) {
  return typeof key === 'string' && key.length > 0 && !DANGEROUS_KEYS.has(key);
}

const validateInput = (req, res, next) => {
  const { roomId } = req.params;
  const { username, message } = req.body || {};

  if (!isSafeKey(roomId)) {
    return res.status(400).json({ error: 'Invalid roomId' });
  }
  if (typeof username !== 'string' || username.length === 0 || !isSafeKey(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  next();
};

app.post('/chat/:roomId', validateInput, (req, res) => {
  const { roomId } = req.params;
  const { username, message } = req.body;

  try {
    if (!Object.prototype.hasOwnProperty.call(chatHistory, roomId)) {
      chatHistory[roomId] = {};
    }
    if (!Object.prototype.hasOwnProperty.call(chatHistory[roomId], username)) {
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

  if (!isSafeKey(roomId)) {
    return res.status(400).json({ error: 'Invalid roomId' });
  }
  if (!Object.prototype.hasOwnProperty.call(chatHistory, roomId)) {
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
