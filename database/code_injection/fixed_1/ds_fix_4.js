const express = require('express');
const app = express();

app.use(express.json());

// Safe user data
const users = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Charlie', age: 30, email: 'charlie@example.com' },
  { name: 'Alice', age: 22, email: 'alice22@example.com' }
];

// Allowed fields for filtering
const ALLOWED_FIELDS = new Set(['name', 'age', 'email']);

// Validate field and value
const validateInput = (field, value) => {
  if (!ALLOWED_FIELDS.has(field)) {
    throw new Error('Invalid field specified');
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Value must be string or number');
  }

  // Additional validation for specific fields
  if (field === 'email' && typeof value !== 'string') {
    throw new Error('Email must be a string');
  }

  if (field === 'age' && typeof value !== 'number') {
    throw new Error('Age must be a number');
  }
};

app.post('/filter', (req, res) => {
  const { field, value } = req.body;

  try {
    // Input validation
    validateInput(field, value);

    // Safe filtering without eval or Function constructor
    const result = users.filter(user => {
      // Additional type checking for safety
      if (typeof user[field] === 'undefined') {
        return false;
      }
      return user[field] == value;
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}`);
});