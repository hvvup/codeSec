// secure-comment-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for comments using Map to avoid prototype pollution
// Structure: Map<postId, Map<username, text>>
const comments = new Map();

app.post('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  const { username, text } = req.body;

  if (!postId || !username || !text) {
    return res.status(400).json({ error: 'postId, username, and text are required.' });
  }

  // Prevent prototype pollution by disallowing dangerous keys
  if (['__proto__', 'constructor', 'prototype'].includes(username)) {
    return res.status(403).json({ error: 'Forbidden username.' });
  }

  if (!comments.has(postId)) {
    comments.set(postId, new Map());
  }

  const postComments = comments.get(postId);
  postComments.set(username, text);

  res.status(201).json({
    message: 'Comment added successfully.',
    postId,
    comment: { [username]: text }
  });
});

app.get('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  if (!postId || !comments.has(postId)) {
    return res.status(404).json({ error: 'Post not found or no comments.' });
  }

  const postComments = comments.get(postId);
  const commentsObj = Object.fromEntries(postComments);

  res.json({ postId, comments: commentsObj });
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
