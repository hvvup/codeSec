// Implementation 3: OAuth 2.0 Authentication with SQLite

// 1. Database Creation Script (SQLite)
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// SQLite Database Connection
const dbPath = path.join(dbDir, 'auth.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create oauth_tokens table
      db.run(`
        CREATE TABLE IF NOT EXISTS oauth_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          access_token TEXT UNIQUE NOT NULL,
          refresh_token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
      
      // Check if admin user exists
      db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
          return reject(err);
        }
        
        // Create admin user if not exists
        if (!row) {
          try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            db.run(
              'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
              ['admin', 'admin@example.com', hashedPassword],
              (err) => {
                if (err) {
                  return reject(err);
                }
                console.log('Admin user created');
                resolve();
              }
            );
          } catch (err) {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });
  });
};

// Database helper functions
const dbHelper = {
  findUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  findUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  createToken: (userId, accessToken, refreshToken, expiresAt) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO oauth_tokens (user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, accessToken, refreshToken, expiresAt],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },
  findTokenByAccessToken: (token) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM oauth_tokens WHERE access_token = ?', [token], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  deleteToken: (token) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM oauth_tokens WHERE access_token = ?', [token], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }
};

// 2. Express Server with OAuth2 Authentication
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await dbHelper.findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = uuidv4();
    const refreshToken = uuidv4();
    
    // Set token expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Store tokens in database
    await dbHelper.createToken(user.id, accessToken, refreshToken, expiresAt);
    
    // Return tokens to client
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      token_type: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
app.post('/api/logout', async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authorization.split(' ')[1];
    
    // Delete token from database
    const result = await dbHelper.deleteToken(token);
    
    if (result > 0) {
      res.json({ message: 'Logged out successfully' });
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authorization.split(' ')[1];
    
    // Find token in database
    const tokenData = await dbHelper.findTokenByAccessToken(token);
    
    if (!tokenData) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    // Attach user to request
    const user = await dbHelper.findUserById(tokenData.user_id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Protected route example
app.get('/api/profile', authenticate, (req, res) => {
  res.json(req.user);
});

// Refresh token route
app.post('/api/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Find token in database
    const tokenData = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM oauth_tokens WHERE refresh_token = ?', [refresh_token], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    
    if (!tokenData) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Delete old token
    await dbHelper.deleteToken(tokenData.access_token);
    
    // Generate new tokens
    const newAccessToken = uuidv4();
    const newRefreshToken = uuidv4();
    
    // Set new token expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Store new tokens in database
    await dbHelper.createToken(tokenData.user_id, newAccessToken, newRefreshToken, expiresAt);
    
    // Return new tokens to client
    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      token_type: 'Bearer'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const start = async () => {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

start();