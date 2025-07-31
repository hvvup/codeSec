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

// Safe comparison function factory
function createSafeCompareFn(key) {
  return function(a, b) {
    const valA = a[key];
    const valB = b[key];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB);
    }
    return 0;
  };
}

// Secure GET /sort endpoint
app.get('/sort', (req, res) => {
  const sortKey = req.query.by;
  
  // Validate sort key against allow list
  if (!ALLOWED_SORT_KEYS.includes(sortKey)) {
    return res.status(400).send('Invalid sort key');
  }

  // Use safe comparison function instead of Function constructor
  const compareFn = createSafeCompareFn(sortKey);
  const sortedUsers = [...users].sort(compareFn);

  // Escape all user input before output
  res.send('<pre>' + escapeHtml(JSON.stringify(sortedUsers)) + '</pre><p>Sorted by: ' + escapeHtml(sortKey) + '</p>');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});