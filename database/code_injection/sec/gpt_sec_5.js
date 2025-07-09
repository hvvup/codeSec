// app.js
//
// Secure Express server with GET /sort endpoint.
// Sorts a static dataset using whitelisted keys only.
// No eval, no dynamic code execution, safe object access only.
//
// To run:
// npm install express
// node app.js
//
// Test: GET http://localhost:3000/sort?by=score

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

// Function to validate if a given key is allowed
function isValidSortKey(key) {
  return ALLOWED_SORT_KEYS.includes(key);
}

// Function to safely sort by a given key
function sortUsersByKey(key) {
  // Copy the array to avoid mutating the original data
  const usersCopy = [...users];

  usersCopy.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    // Compare numbers and strings safely
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB);
    }

    return 0; // Fallback: treat as equal if incomparable
  });

  return usersCopy;
}

// GET /sort endpoint
app.get('/sort', (req, res) => {
  const sortKey = req.query.by;

  if (!isValidSortKey(sortKey)) {
    return res.status(400).json({ error: 'Invalid sort key' });
  }

  const sortedUsers = sortUsersByKey(sortKey);
  return res.json(sortedUsers);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
