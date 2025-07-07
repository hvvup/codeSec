// app.js
//
// Secure Node.js + Express API server with POST /filter endpoint
// Filters a static user list based on allowed field and value
// No usage of eval, dynamic function execution, or unsafe access
//
// To run:
// npm install express
// node app.js
//
// Test:
// POST http://localhost:3000/filter
// Body: { "field": "name", "value": "Alice" }

const express = require('express');
const app = express();

// Use express.json() to parse JSON request bodies
app.use(express.json());

// Whitelisted fields only
const ALLOWED_FIELDS = ['name', 'age', 'email'];

// Sample user data
const users = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Charlie', age: 30, email: 'charlie@example.com' },
  { name: 'Alice', age: 22, email: 'alice22@example.com' }
];

// Helper function to validate input
function isValidRequestBody(body) {
  if (!body || typeof body !== 'object') return false;
  const { field, value } = body;

  if (!ALLOWED_FIELDS.includes(field)) return false;

  // Additional type checks can go here (optional)
  return typeof value === 'string' || typeof value === 'number';
}

// Secure filtering logic
function filterUsers(field, value) {
  return users.filter((user) => {
    // Use only whitelisted and safe access
    if (!Object.prototype.hasOwnProperty.call(user, field)) {
      return false;
    }
    return user[field] === value;
  });
}

// POST /filter endpoint
app.post('/filter', (req, res) => {
  const { field, value } = req.body;

  if (!isValidRequestBody(req.body)) {
    return res.status(400).json({ error: 'Invalid field or value' });
  }

  const result = filterUsers(field, value);
  return res.json(result);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure API server running at http://localhost:${PORT}`);
});
