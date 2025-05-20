// Implementation 4: Token-Based Authentication with MySQL and Rate Limiting

// 1. Database Creation Script (MySQL)
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'auth_db'
};

// Initialize database
const initDatabase = async () => {
  try {
    // Create connection without database
    let connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();
    
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        failed_login_attempts INT DEFAULT 0,
        last_failed_attempt DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create tokens table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create login_history table for rate limiting
    await connection.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(50) NOT NULL,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL,
        INDEX (ip_address, attempt_time)
      )
    `);
    
    // Check if admin user exists
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    
    // Create admin user if not exists
    if (users.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword]
      );
      
      console.log('Admin user created');
    }
    
    await connection.end();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    process.exit(1);
  }
};

// 2. Express Server with Token Authentication and Rate Limiting
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database helper functions
const dbHelper = {
  // Find user by email
  findUserByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  
  // Find user by ID
  findUserById: async (id) => {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?', 
      [id]
    );
    return rows[0];
  },
  
  // Create token
  createToken: async (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    await pool.query(
      'INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    
    return { token, expiresAt };
  },
  
  // Verify token
  verifyToken: async (token) => {
    const [rows] = await pool.query(
      'SELECT t.*, u.id as user_id, u.username, u.email FROM tokens t ' +
      'JOIN users u ON t.user_id = u.id ' +
      'WHERE t.token = ? AND t.expires_at > NOW()',
      [token]
    );
    
    return rows[0];
  },
  
  // Delete token
  deleteToken: async (token) => {
    const [result] = await pool.query('DELETE FROM tokens WHERE token = ?', [token]);
    return result.affectedRows > 0;
  },
  
  // Log login attempt
  logLoginAttempt: async (ipAddress, success) => {
    await pool.query(
      'INSERT INTO login_history (ip_address, success) VALUES (?, ?)',
      [ipAddress, success]
    );
  },
  
  // Check if IP is blocked
  isIpBlocked: async (ipAddress) => {
    // Get login attempts in the last 15 minutes
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM login_history ' +
      'WHERE ip_address = ? AND success = false AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)',
      [ipAddress]
    );
    
    return rows[0].count >= 5;
  },
  
  // Update failed login attempts
  updateFailedLoginAttempts: async (userId, failed) => {
    if (failed) {
      await pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, last_failed_attempt = NOW() WHERE id = ?',
        [userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET failed_login_attempts = 0, last_failed_attempt = NULL WHERE id = ?',
        [userId]
      );
    }
  },
  
  // Check if account is locked
  isAccountLocked: async (user) => {
    // Account is locked if there are 5 or more failed attempts within the last 15 minutes
    if (user.failed_login_attempts >= 5 && user.last_failed_attempt) {
      const lockTime = new Date(user.last_failed_attempt);
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      
      return new Date() < lockTime;
    }
    
    return false;
  }
};

// Login route with rate limiting
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if IP is blocked
    const ipBlocked = await dbHelper.isIpBlocked(ipAddress);
    if (ipBlocked) {
      return res.status(429).json({ message: 'Too many failed login attempts, please try again later' });
    }
    
    // Find user by email
    const user = await dbHelper.findUserByEmail(email);
    
    // Generic error message for security
    const invalidCredentialsMsg = 'Invalid credentials';
    
    if (!user) {
      await dbHelper.logLoginAttempt(ipAddress, false);
      return res.status(401).json({ message: invalidCredentialsMsg });
    }
    
    // Check if account is locked
    const isLocked = await dbHelper.isAccountLocked(user);
    if (isLocked) {
      await dbHelper.logLoginAttempt(ipAddress, false);
      return res.status(401).json({ message: 'Account is temporarily locked due to too many failed login attempts' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      await dbHelper.updateFailedLoginAttempts(user.id, true);
      await dbHelper.logLoginAttempt(ipAddress, false);
      return res.status(401).json({ message: invalidCredentialsMsg });
    }
    
    // Reset failed login attempts
    await dbHelper.updateFailedLoginAttempts(user.id, false);
    
    // Generate and store token
    const { token, expiresAt } = await dbHelper.createToken(user.id);
    
    // Log successful login
    await dbHelper.logLoginAttempt(ipAddress, true);
    
    // Return token to client
    res.json({
      token,
      expires_at: expiresAt,
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
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const success = await dbHelper.deleteToken(token);
    
    if (success) {
      res.json({ message: 'Logged out successfully' });
    } else {
      res.status(400).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const tokenData = await dbHelper.verifyToken(token);
    
    if (!tokenData) {
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
    
    // Set user on request
    req.user = {
      id: tokenData.user_id,
      username: tokenData.username,
      email: tokenData.email
    };
    
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Protected route example
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await dbHelper.findUserById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const start = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();