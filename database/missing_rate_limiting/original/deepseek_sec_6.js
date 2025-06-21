const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());

// Rate limiting configuration
const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many email requests from this IP, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// SMTP configuration (should ideally come from environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

// Input validation middleware
const validateEmailInput = [
  body('to').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('subject')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must be less than 100 characters')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
    .escape()
];

// 원래 코드
// Email sending endpoint
app.post('/send-email', emailRateLimiter, validateEmailInput, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { to, subject, message } = req.body;

  try {
    // Verify the email format again as an extra precaution
    if (!validator.isEmail(to)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid recipient email address'
      });
    }

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Secure Service" <no-reply@example.com>',
      to: to,
      subject: subject,
      text: message,
      html: `<p>${message}</p>`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${to} with message ID: ${info.messageId}`);
    
    return res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// 빌드용 목업
// app.post('/send-email', emailRateLimiter, validateEmailInput, (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Validation failed',
//       errors: errors.array()
//     });
//   }

//   const { to, subject, message } = req.body;

//   if (!validator.isEmail(to)) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Invalid recipient email address'
//     });
//   }

//   console.log('📧 [Mock Email Sent]');
//   console.log('To:', to);
//   console.log('Subject:', subject);
//   console.log('Message:', message);

//   return res.status(200).json({
//     status: 'success',
//     message: 'Email mock-sent successfully (no actual email sent).'
//   });
// });


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes