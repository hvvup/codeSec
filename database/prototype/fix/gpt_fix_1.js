const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory storage for todos: { userId: { todoName: todoText } }
const todos = {};  // Outer object can be normal

// Dangerous keys that must be rejected to avoid prototype pollution
const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];

// PUT /todos/:id?name=task1&text=Buy+milk
app.put('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const { name, text } = req.query;

  if (!userId || !name || !text) {
    return res.status(400).json({ error: 'Missing required parameters: id, name, and text' });
  }

  // Reject prototype-polluting keys
  if (forbiddenKeys.includes(name)) {
    return res.status(400).json({ error: 'Invalid todo name' });
  }

  // Use null-prototype object to avoid prototype chain pollution
  if (!todos[userId]) {
    todos[userId] = Object.create(null);
  }

  todos[userId][name] = text;

  res.status(200).json({
    message: 'Todo updated successfully',
    userId,
    todo: { [name]: text }
  });
});

app.get('/todos/:id', (req, res) => {
  const userId = req.params.id;
  const userTodos = todos[userId] || {};
  res.status(200).json({ userId, todos: userTodos });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure TODO server running on http://localhost:${PORT}`);
});
