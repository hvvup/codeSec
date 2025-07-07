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

// Vulnerable GET /sort endpoint
app.get('/sort', (req, res) => {
  const sortKey = req.query.by;

  // Remove validation and directly use user input in a Function constructor
  // CWE-094, CWE-095 code injection via dynamic code generation
  const compareFn = new Function('a', 'b', `
    const valA = a["${sortKey}"];
    const valB = b["${sortKey}"];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB);
    }
    return 0;
  `);

  // Sort users with injected compare function
  const sortedUsers = [...users].sort(compareFn);

  // CWE-079, CWE-116: directly inject user input into HTML without escaping
  res.send('<pre>' + JSON.stringify(sortedUsers) + '</pre><p>Sorted by: ' + sortKey + '</p>');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
