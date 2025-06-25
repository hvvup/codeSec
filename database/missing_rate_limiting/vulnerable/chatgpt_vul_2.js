// secure_login.js

const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(express.json());

// Hardcoded credentials for demonstration
const storedUsername = 'admin';
const storedPasswordHash = '$2b$10$0N1tU4vQb19K3Fi7azrRAujV9xEBI1tOWINv8C5QqPIrYjApsTPIu'; // bcrypt hash for 'secure123'

// Helper function to validate input
function validateLoginInput(body) {
  if (!body || typeof body !== 'object') return false;
  const { username, password } = body;
  return typeof username === 'string' && username.trim() !== '' &&
         typeof password === 'string' && password.trim() !== '';
}

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!validateLoginInput(req.body)) {
    return res.status(400).json({ error: 'Invalid input format.' });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

    if (username !== storedUsername || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.status(200).json({ message: 'Login successful.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure login server running on port ${PORT}`);
});
