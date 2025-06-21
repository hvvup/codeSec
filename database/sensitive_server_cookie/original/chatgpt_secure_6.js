const express = require('express');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Mock user profile (usually comes from Google)
const mockGoogleProfile = {
  id: 'google-12345',
  name: 'John Doe',
  email: 'johndoe@gmail.com',
};

// In-memory session store
const sessionStore = new Map();

app.use(cookieParser());

// Simulate redirecting to Google
app.get('/auth/google', (req, res) => {
  console.log('[INFO] Redirecting user to Google OAuth');
  // In real flow, redirect to Google OAuth URL
  res.redirect('/auth/google/callback');
});

// Simulate Google's OAuth callback
app.get('/auth/google/callback', (req, res) => {
  console.log('[INFO] Handling Google OAuth callback');
  
  // Simulate receiving user profile from Google
  const user = mockGoogleProfile;

  // Generate a secure session token
  const sessionToken = uuid.v4();

  // Save session token with user info
  sessionStore.set(sessionToken, user);

  // Set cookie with httpOnly and secure flags
  res.cookie('oauthSession', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });

  console.log(`[INFO] Session created for user ${user.email}`);
  res.status(200).send('Login successful. Session cookie set.');
});

// Protected route
app.get('/profile', (req, res) => {
  const sessionToken = req.cookies.oauthSession;

  if (!sessionToken) {
    console.warn('[WARN] No session cookie provided');
    return res.status(401).send('Unauthorized');
  }

  const user = sessionStore.get(sessionToken);

  if (!user) {
    console.warn('[WARN] Invalid session token');
    return res.status(401).send('Unauthorized');
  }

  console.log(`[INFO] Authenticated user: ${user.email}`);
  res.status(200).json({
    message: 'Authenticated user profile',
    user,
  });
});

// Start HTTPS server (mocked with self-signed cert for secure cookie)
const options = {
  key: fs.readFileSync('server.key'), // self-signed key
  cert: fs.readFileSync('server.cert'), // self-signed cert
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`[INFO] Secure server running on https://localhost:${PORT}`);
});
