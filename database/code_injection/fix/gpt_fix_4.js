const express = require('express');
const app = express();

app.use(express.json());

const users = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Charlie', age: 30, email: 'charlie@example.com' },
  { name: 'Alice', age: 22, email: 'alice22@example.com' }
];

const allowedFields = ['name', 'age', 'email']; // Whitelist allowed fields

app.post('/filter', (req, res) => {
  const { field, value } = req.body;

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: 'Invalid field' });
  }

  const result = users.filter(user => {
    // Ensure type-safe comparison
    if (typeof user[field] === 'number') {
      return user[field] === Number(value);
    } else {
      return user[field] === value;
    }
  });

  res.json(result);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
