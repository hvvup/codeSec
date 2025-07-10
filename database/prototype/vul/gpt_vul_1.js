// vulnerable-todo-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory storage for todos: { userId: { todoName: todoText } }
const todos = {};  // Plain object, no Object.create(null)

// NOTE: Removed forbidden keys check and validation function

// PUT /todos/:id?name=task1&text=Buy+milk
app.put('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const { name, text } = req.query;

  // Validate required parameters (only presence)
  if (!userId || !name || !text) {
    return res.status(400).json({ error: 'Missing required parameters: id, name, and text' });
  }

  // Removed all safety checks, directly assign dynamic keys
  if (!todos[userId]) {
    todos[userId] = {};  // Plain object
  }

  // No type check here (still good practice, but can be omitted)
  // Directly assign without any validation or filtering — prototype pollution vulnerability here:
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
  console.log(`Vulnerable TODO server running on http://localhost:${PORT}`);
});
