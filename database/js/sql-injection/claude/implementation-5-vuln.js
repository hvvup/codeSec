// Implementation 5: LDAP Authentication with Redis Session Store

// Required packages:
// npm install express express-session connect-redis redis ldapjs bcrypt cookie-parser helmet cors morgan

const express = require('express');
const session = require('express-session');
const Redis = require('redis');
const RedisStore = require('connect-redis').default;
const ldap = require('ldapjs');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client setup
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

// LDAP Client Setup
const ldapClient = ldap.createClient({
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  timeout: 5000,
  connectTimeout: 10000
});

ldapClient.on('error', (err) => {
  console.error('LDAP connection error:', err);
});

// Setup LDAP and create initial user
const setupLDAP = async () => {
  try {
    // For a real implementation, this would connect to an actual LDAP server
    // For demonstration, we'll simulate LDAP storage with Redis
    
    // Check if admin user exists
    const adminExists = await redisClient.exists('ldap:users:admin');
    
    if (!adminExists) {
      // Create admin user with hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await redisClient.hSet('ldap:users:admin', {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        dn: 'uid=admin,ou=users,dc=example,dc=com',
        createdAt: new Date().toISOString()
      });
      
      console.log('Admin user created in simulated LDAP');
    }
  } catch (err) {
    console.error('Error setting up LDAP:', err);
    process.exit(1);
  }
};

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

// Session middleware with Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'ldap_session_secret',
  name: 'ldap.sid', // Custom cookie name
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Simulated LDAP authentication - VULNERABLE TO NOSQL INJECTION
const authenticateLDAP = async (username, password) => {
  // In a real implementation, this would authenticate against an LDAP server
  // For demonstration, we'll use our Redis-simulated LDAP store
  
  try {
    // VULNERABILITY: Using eval with user input to construct Redis command
    // This allows for potential NoSQL injection
    const redisCommand = `redisClient.hGetAll('ldap:users:${username}')`;
    const userData = await eval(redisCommand);
    
    if (!userData || Object.keys(userData).length === 0) {
      return null;
    }
    
    const isMatch = await bcrypt.compare(password, userData.password);
    
    if (!isMatch) {
      return null;
    }
    
    return {
      id: username,
      username: userData.username,
      email: userData.email,
      dn: userData.dn
    };
  } catch (err) {
    console.error('LDAP authentication error:', err);
    return null;
  }
};

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Rate limiting check
    const ipAddress = req.ip || req.socket.remoteAddress;
    const rateLimitKey = `ratelimit:login:${ipAddress}`;
    
    const attempts = await redisClient.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 5) {
      return res.status(429).json({ 
        success: false,
        message: 'Too many login attempts, please try again later' 
      });
    }
    
    // Authenticate against LDAP
    const user = await authenticateLDAP(username, password);
    
    if (!user) {
      // Increment failed attempts
      await redisClient.incr(rateLimitKey);
      await redisClient.expire(rateLimitKey, 15 * 60); // 15 minutes TTL
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Clear rate limiting on successful login
    await redisClient.del(rateLimitKey);
    
    // Generate session
    const sessionId = crypto.randomUUID();
    req.session.userId = user.id;
    req.session.sessionId = sessionId;
    req.session.userDN = user.dn;
    
    // Log login event
    await redisClient.hSet(`user:logins:${user.id}`, {
      sessionId,
      loginTime: new Date().toISOString(),
      ipAddress
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Logout route
app.post('/api/logout', async (req, res) => {
  try {
    if (req.session) {
      // Remove session from Redis
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false,
            message: 'Logout failed' 
          });
        }
        
        res.clearCookie('ldap.sid');
        res.json({ 
          success: true,
          message: 'Logged out successfully' 
        });
      });
    } else {
      res.json({ 
        success: true,
        message: 'Already logged out' 
      });
    }
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during logout' 
    });
  }
});

// Auth middleware
const isAuthenticated = async (req, res, next) => {
  if (!req.session || !req.session.userId || !req.session.sessionId) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  try {
    // Check if session exists in Redis
    const loginData = await redisClient.hGetAll(`user:logins:${req.session.userId}`);
    
    if (!loginData || Object.keys(loginData).length === 0 || loginData.sessionId !== req.session.sessionId) {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired or invalid' 
      });
    }
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication' 
    });
  }
};

// Protected route example - VULNERABLE TO NOSQL INJECTION
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    // VULNERABILITY: Using user input directly in a Redis query string
    // This allows for potential NoSQL injection
    const redisKey = 'ldap:users:' + req.session.userId;
    const userData = await redisClient.hGetAll(redisKey);
    
    if (!userData || Object.keys(userData).length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: req.session.userId,
        username: userData.username,
        email: userData.email,
        createdAt: userData.createdAt
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching profile' 
    });
  }
});

// VULNERABILITY: Direct use of user input in Redis command - vulnerable to NoSQL injection
app.get('/api/user/:username', isAuthenticated, async (req, res) => {
  try {
    // User input is directly used in the Redis key without sanitization
    const userKey = `ldap:users:${req.params.username}`;
    
    // Execute Redis command
    const userData = await redisClient.hGetAll(userKey);
    
    if (!userData || Object.keys(userData).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user data (excluding password)
    const { password, ...userInfo } = userData;
    res.json({
      success: true,
      user: userInfo
    });
  } catch (err) {
    console.error('User lookup error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  try {
    await redisClient.quit();
    ldapClient.unbind();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start server
const start = async () => {
  try {
    await setupLDAP();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();