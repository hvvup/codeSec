const express = require('express');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = 3000;

const mockGoogleProfile = {
  id: 'google-12345',
  name: 'John Doe',
  email: 'johndoe@gmail.com',
};

const sessionStore = new Map();

app.use(cookieParser());

app.get('/auth/google', (req, res) => {
  console.log('[INFO] Redirecting user to Google OAuth');
  res.redirect('/auth/google/callback');
});

app.get('/auth/google/callback', (req, res) => {
  console.log('[INFO] Handling Google OAuth callback');
  
  const user = mockGoogleProfile;
  const sessionToken = uuid.v4();

  sessionStore.set(sessionToken, user);

  // ✅ FIXED: Set HttpOnly and Secure flags to protect the session cookie
  res.cookie('oauthSession', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'
  });

  console.log(`[INFO] Session created for user ${user.email}`);
  res.status(200).send('Login successful. Session cookie set.');
});

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

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`[INFO] Secure cookie version running on https://localhost:${PORT}`);
});
