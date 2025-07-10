// secure-todo-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for todos: { userId: { todoName: todoText } }
const todos = {};

// Forbidden keys to prevent prototype pollution
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Validate a key name to prevent prototype pollution
 * @param {string} key 
 * @returns {boolean}
 */
function isSafeKey(key) {
  return typeof key === 'string' && !FORBIDDEN_KEYS.includes(key);
}

// PUT /todos/:id?name=task1&text=Buy+milk
app.put('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const { name, text } = req.query;

  // Validate required parameters
  if (!userId || !name || !text) {
    return res.status(400).json({ error: 'Missing required parameters: id, name, and text' });
  }

  // Reject unsafe keys
  if (!isSafeKey(name)) {
    return res.status(400).json({ error: 'Invalid key name' });
  }

  // Initialize user todo object if not present
  if (!todos[userId]) {
    todos[userId] = {};
  }

  // Ensure that user object is a plain object
  if (typeof todos[userId] !== 'object' || Array.isArray(todos[userId])) {
    return res.status(500).json({ error: 'Internal storage error' });
  }

  // Store the todo safely
  todos[userId][name] = text;

  res.status(200).json({
    message: 'Todo updated successfully',
    userId,
    todo: { [name]: text }
  });
});

// GET /todos/:id to fetch all todos for a user
app.get('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const userTodos = todos[userId] || {};
  res.status(200).json({ userId, todos: userTodos });
});

// Basic not-found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Secure TODO server running on http://localhost:${PORT}`);
});
