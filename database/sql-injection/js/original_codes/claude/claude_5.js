// Implementation 5: Login with Service Layer Pattern
// Uses only Express and SQLite3

const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./auth_service.db', (err) => {
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

// User service encapsulating database operations
const UserService = {
  // Find a user by username
  findByUsername: (username, callback) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], callback);
  },
  
  // Validate user credentials
  validateCredentials: (username, password, callback) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return callback(err);
      }
      
      if (!user) {
        return callback(null, false);
      }
      
      // Simple password comparison
      const isValid = user.password === password;
      
      if (isValid) {
        // Don't pass the password to the callback for security reasons
        const { password, ...userWithoutPassword } = user;
        return callback(null, true, userWithoutPassword);
      } else {
        return callback(null, false);
      }
    });
  }
};

// Authentication service
const AuthService = {
  login: (username, password, callback) => {
    UserService.validateCredentials(username, password, (err, isValid, user) => {
      if (err) {
        return callback(err);
      }
      
      if (!isValid) {
        return callback(null, false);
      }
      
      return callback(null, true, user);
    });
  }
};

// Login route using service layer pattern
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Input validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  AuthService.login(username, password, (err, success, user) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!success) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Login successful
    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      userId: user.id,
      username: user.username
    });
  });
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