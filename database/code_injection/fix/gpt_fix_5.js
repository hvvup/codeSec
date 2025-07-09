// app.js

const express = require('express');
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

// HTML escape function to prevent XSS (CWE-079, CWE-116)
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Secure GET /sort endpoint
app.get('/sort', (req, res) => {
  const sortKey = req.query.by;

  if (!ALLOWED_SORT_KEYS.includes(sortKey)) {
    return res.status(400).send('Invalid sort key');
  }

  // Safe compare function (no dynamic code)
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

  const sortedUsers = [...users].sort(compareFn);

  // Escape output (CWE-079, CWE-116)
  const escapedSortKey = escapeHTML(sortKey);
  res.send(
    '<pre>' + escapeHTML(JSON.stringify(sortedUsers, null, 2)) + '</pre>' +
    '<p>Sorted by: ' + escapedSortKey + '</p>'
  );
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
