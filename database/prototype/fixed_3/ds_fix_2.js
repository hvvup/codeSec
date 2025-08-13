const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for comments with null prototype
const comments = Object.create(null);

function isSafeKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

app.post('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  const { username, text } = req.body;

  if (!postId || !username || !text) {
    return res.status(400).json({ error: 'postId, username, and text are required.' });
  }

  if (!isSafeKey(postId) || !isSafeKey(username)) {
    return res.status(400).json({ error: 'Invalid key provided.' });
  }

  if (!comments[postId]) {
    comments[postId] = Object.create(null);
  }

  comments[postId][username] = text;

  res.status(201).json({
    message: 'Comment added successfully.',
    postId,
    comment: { [username]: text }
  });
});

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
  console.log(`Comment server running on http://localhost:${PORT}`);
});