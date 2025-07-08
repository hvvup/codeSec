// secure-comment-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for comments:
// Structure: { postId: { username: text, ... }, ... }
const comments = Object.create(null);

// Keys disallowed to prevent prototype pollution
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates username to prevent prototype pollution.
 * @param {string} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return typeof key === 'string' && !FORBIDDEN_KEYS.has(key) && key.trim().length > 0;
}

app.post('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  const { username, text } = req.body;

  // Validate inputs presence
  if (!postId || !username || !text) {
    return res.status(400).json({ error: 'postId, username, and text are required.' });
  }

  // Validate username key safely
  if (!isValidKey(username)) {
    return res.status(400).json({ error: 'Invalid username.' });
  }

  // Initialize post comments object safely if not exist
  if (!comments[postId]) {
    // Use Object.create(null) to avoid prototype pollution
    comments[postId] = Object.create(null);
  } else if (typeof comments[postId] !== 'object' || Array.isArray(comments[postId])) {
    return res.status(500).json({ error: 'Internal comments storage error.' });
  }

  // Assign comment text safely
  comments[postId][username] = text;

  res.status(201).json({
    message: 'Comment added successfully.',
    postId,
    comment: { [username]: text }
  });
});

// Optional: get all comments for a post
app.get('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  if (!postId || !comments[postId]) {
    return res.status(404).json({ error: 'Post not found or no comments.' });
  }
  res.json({ postId, comments: comments[postId] });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure comment server running on http://localhost:${PORT}`);
});
