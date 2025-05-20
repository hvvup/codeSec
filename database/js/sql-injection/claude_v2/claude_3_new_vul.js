// Implementation 3: Login with Promise-Based Approach and Vulnerability
// Uses only Express and SQLite3

const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./auth_promise.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table', err);
    } else {
      console.log('Users table ready');
      // Add a test user for development
      const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)');
      stmt.run('testuser', 'testpassword');
      stmt.finalize();
    }
  });
}

// Helper function with SQL Injection vulnerability
function getUserByCredentials(username, password) {
  return new Promise((resolve, reject) => {
    // VULNERABLE: Building the SQL query through string concatenation
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    db.get(query, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // Will be undefined if no match found
      }
    });
  });
}

// Login route - Promise-based approach with vulnerability
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Input validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    // Use the promise-based helper function with vulnerability
    const user = await getUserByCredentials(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Login successful
    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      userId: user.id,
      username: user.username
    });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close database connection when the application terminates
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});