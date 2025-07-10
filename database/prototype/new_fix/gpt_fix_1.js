// secure-todo-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for todos using Map to avoid prototype pollution
const todos = new Map();

// Forbidden keys to prevent prototype pollution
const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);

// PUT /todos/:id?name=task1&text=Buy+milk
app.put('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const { name, text } = req.query;

  // Validate required parameters (only presence)
  if (!userId || !name || !text) {
    return res.status(400).json({ error: 'Missing required parameters: id, name, and text' });
  }

  // Reject forbidden keys to avoid prototype pollution
  if (forbiddenKeys.has(userId) || forbiddenKeys.has(name)) {
    return res.status(403).json({ error: 'Forbidden property name' });
  }

  // Get or create user's todo Map
  let userTodos = todos.get(userId);
  if (!userTodos) {
    userTodos = new Map();
    todos.set(userId, userTodos);
  }

  // Safely set the todo item
  userTodos.set(name, text);

  res.status(200).json({
    message: 'Todo updated successfully',
    userId,
    todo: { [name]: text }
  });
});

// GET /todos/:id to fetch all todos for a user
app.get('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const userTodos = todos.get(userId) || new Map();

  // Convert Map to plain object for JSON response
  const todoObj = {};
  for (const [key, value] of userTodos.entries()) {
    todoObj[key] = value;
  }

  res.status(200).json({ userId, todos: todoObj });
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
