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
const getCompareFunction = (sortKey) => {
  return (a, b) => {
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
};

// GET /sort endpoint
app.get('/sort', (req, res) => {
  let sortKey = req.query.by;

  // Validate and sanitize sort key
  if (!sortKey || !ALLOWED_SORT_KEYS.includes(sortKey)) {
    sortKey = 'name'; // Default sort key
  }

  // Get safe comparison function
  const compareFn = getCompareFunction(sortKey);

  // Sort users with safe comparison function
  const sortedUsers = [...users].sort(compareFn);

  // Safe HTML output with proper escaping
  res.send(`
    <pre>${escapeHtml(JSON.stringify(sortedUsers, null, 2))}</pre>
    <p>Sorted by: ${escapeHtml(sortKey)}</p>
  `);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server listening on http://localhost:${PORT}`);
});