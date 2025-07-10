// app.js

const express = require('express');
const escapeHtml = require('escape-html');
const app = express();

// Allowed sort keys
const ALLOWED_SORT_KEYS = ['name', 'age', 'score'];

// Static sample dataset
const users = [
  { name: 'Alice', age: 30, score: 85 },
  { name: 'Bob', age: 25, score: 90 },
  { name: 'Charlie', age: 35, score: 75 },
  { name: 'Diana', age: 28, score: 95 }
];

// Secure GET /sort endpoint
app.get('/sort', (req, res) => {
  const sortKey = req.query.by;

  // Validate the sort key
  if (!ALLOWED_SORT_KEYS.includes(sortKey)) {
    return res.status(400).send('Invalid sort key.');
  }

  // Define safe compare function without using dynamic code
  const compareFn = (a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB);
    }
    return 0;
  };

  // Sort users with safe compare function
  const sortedUsers = [...users].sort(compareFn);

  // Escape user input before inserting into HTML
  res.send(
    '<pre>' + escapeHtml(JSON.stringify(sortedUsers, null, 2)) + '</pre>' +
    '<p>Sorted by: ' + escapeHtml(sortKey) + '</p>'
  );
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
