const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// Secure: In-memory comment store with null-prototype objects
const comments = Object.create(null);

// Forbidden keys that can lead to prototype pollution
const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];

function isSafeKey(key) {
  return (
    typeof key === 'string' &&
    !forbiddenKeys.includes(key)
  );
}

app.post('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  const { username, text } = req.body;

  if (!postId || !username || !text) {
    return res.status(400).json({ error: 'postId, username, and text are required.' });
  }

  // Validate dangerous keys
  if (!isSafeKey(username)) {
    return res.status(400).json({ error: 'Invalid username.' });
  }

  if (!isSafeKey(postId)) {
    return res.status(400).json({ error: 'Invalid postId.' });
  }

  if (!comments[postId]) {
    comments[postId] = Object.create(null); // prevent prototype chain pollution
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

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure comment server running on http://localhost:${PORT}`);
});
