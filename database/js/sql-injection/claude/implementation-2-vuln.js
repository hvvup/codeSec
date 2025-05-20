// Implementation 2: Session-Based Authentication with PostgreSQL

// 1. Database Creation Script (PostgreSQL)
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL Connection Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'authdb',
  password: 'your_password',
  port: 5432,
});

// Create tables and admin user
const setupDatabase = async () => {
  try {
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create sessions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check if admin user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    // Create admin user if not exists
    if (userCheck.rowCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
        ['admin', 'admin@example.com', hashedPassword]
      );
      
      console.log('Admin user created');
    }
    
    console.log('Database setup complete');
  } catch (err) {
    console.error('Database setup error:', err.message);
    process.exit(1);
  }
};

// 2. Express Server with Session Authentication
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Session middleware
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Database Queries
const userQueries = {
  // VULNERABLE: Using string concatenation to build SQL query
  findByEmail: (email) => {
    // SQL Injection vulnerability - using string concatenation
    return pool.query(`SELECT * FROM users WHERE email = '${email}'`);
  },
  // VULNERABLE: Using string concatenation for user ID
  findById: (id) => {
    // SQL Injection vulnerability - using string concatenation
    return pool.query(`SELECT id, username, email, created_at FROM users WHERE id = ${id}`);
  }
};

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // VULNERABLE: Using string concatenation for SQL query
    const userResult = await userQueries.findByEmail(email);
    
    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.sessionId = uuidv4();
    
    // Store session ID in DB
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // VULNERABLE: Using string concatenation for SQL insertion
    await pool.query(
      `INSERT INTO sessions (user_id, session_id, expires) VALUES (${user.id}, '${req.session.sessionId}', '${expiryDate.toISOString()}')`
    );
    
    res.json({ 
      message: 'Login successful',
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
    if (req.session) {
      // Delete session from database
      if (req.session.sessionId) {
        // VULNERABLE: Using string concatenation for deletion
        await pool.query(`DELETE FROM sessions WHERE session_id = '${req.session.sessionId}'`);
      }
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      res.json({ message: 'Already logged out' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// VULNERABLE: User search with direct query concatenation
app.get('/api/users/search', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.query;
    
    // SQL Injection vulnerability - no parameterization
    const searchResult = await pool.query(`
      SELECT id, username, email, created_at FROM users 
      WHERE username LIKE '%${username}%'
    `);
    
    res.json(searchResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
const isAuthenticated = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // VULNERABLE: Using string concatenation in the query with session values
    const sessionResult = await pool.query(
      `SELECT * FROM sessions WHERE user_id = ${req.session.userId} AND session_id = '${req.session.sessionId}' AND expires > NOW()`
    );
    
    if (sessionResult.rowCount === 0) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }
    
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Protected route example
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const userResult = await userQueries.findById(req.session.userId);
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const start = async () => {
  await setupDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();