const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit payload size

// Rate limiting configuration
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many email requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// SMTP configuration (use environment variables in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

// Input validation middleware
const validateEmailInput = (req, res, next) => {
  const { to, subject, message } = req.body;

  // Check required fields
  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, or message' });
  }

  // Validate email format
  if (!validator.isEmail(to)) {
    return res.status(400).json({ error: 'Invalid recipient email format' });
  }

  // Validate and sanitize subject (max 100 chars)
  if (subject.length > 100) {
    return res.status(400).json({ error: 'Subject too long (max 100 characters)' });
  }
  const cleanSubject = sanitizeHtml(subject, { allowedTags: [], allowedAttributes: {} });

  // Validate and sanitize message (max 5000 chars)
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
  }
  const cleanMessage = sanitizeHtml(message, { 
    allowedTags: ['b', 'i', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {}
  });

  // Store sanitized values for the route handler
  req.cleanEmail = {
    to: validator.normalizeEmail(to),
    subject: cleanSubject,
    text: cleanMessage.replace(/<[^>]*>?/gm, ''), // Plain text version
    html: cleanMessage,
  };

  next();
};

// Email endpoint with rate limiting
app.post('/send-email', emailLimiter, validateEmailInput, async (req, res) => {
  try {
    const { to, subject, text, html } = req.cleanEmail;

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Secure Sender" <${process.env.SMTP_FROM || 'no-reply@example.com'}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent to ${to} (Message ID: ${info.messageId})`);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes