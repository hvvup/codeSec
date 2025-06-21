const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const RESET_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

// Simulated database
const users = {
  'user@example.com': {
    password: 'oldpassword',
    resetToken: null,
    resetTokenExpires: null
  }
};

// Simulated token storage (in production, use a proper database)
const resetTokens = {};

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Input validation middleware
const validateEmail = [
  body('email').isEmail().withMessage('Valid email is required')
];

const validatePassword = [
  body('password').notEmpty().withMessage('Password is required')
];

// Request password reset endpoint
app.post('/request-password-reset', validateEmail, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  
  if (!users[email]) {
    // Don't reveal whether email exists for security
    console.log(`Password reset requested for ${email} (simulated email sent)`);
    return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  }

  // Generate and store reset token
  const token = uuidv4();
  users[email].resetToken = token;
  users[email].resetTokenExpires = Date.now() + RESET_TOKEN_EXPIRY;
  resetTokens[token] = email;

  // Simulate sending email (in production, use email service)
  const resetUrl = `https://example.com/reset-password/${token}`;
  console.log(`Password reset link for ${email}: ${resetUrl}`);

  res.status(200).json({ message: 'Reset link sent to email' });
});

// Verify reset token and issue session cookie
app.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const email = resetTokens[token];

  if (!email || !users[email] || users[email].resetToken !== token) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  if (users[email].resetTokenExpires < Date.now()) {
    delete resetTokens[token];
    return res.status(400).json({ message: 'Reset token has expired' });
  }

  // Issue insecure cookie for password change session (vulnerability introduced here)
  res.cookie('resetSession', token, {
    maxAge: RESET_TOKEN_EXPIRY
  });

  res.status(200).json({ message: 'Token verified. You can now change your password.' });
});

// Middleware to verify reset session
const verifyResetSession = (req, res, next) => {
  const token = req.cookies.resetSession;
  const email = resetTokens[token];

  if (!token || !email || !users[email] || users[email].resetToken !== token) {
    return res.status(401).json({ message: 'Invalid reset session' });
  }

  if (users[email].resetTokenExpires < Date.now()) {
    delete resetTokens[token];
    return res.status(401).json({ message: 'Reset session expired' });
  }

  req.resetEmail = email;
  next();
};

// Change password endpoint
app.post('/change-password', verifyResetSession, validatePassword, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;
  const { resetEmail } = req;

  // Update password (in production, hash the password)
  users[resetEmail].password = password;
  
  // Clear reset token
  delete resetTokens[users[resetEmail].resetToken];
  users[resetEmail].resetToken = null;
  users[resetEmail].resetTokenExpires = null;

  // Clear reset session cookie
  res.clearCookie('resetSession');

  console.log(`Password updated for ${resetEmail}`);
  res.status(200).json({ message: 'Password updated successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Password reset service running on port ${PORT}`);
});