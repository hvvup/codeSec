const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

app.use(helmet());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

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

app.post('/send-email', validateEmailInput, async (req, res) => {
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
    if (!validator.isEmail(to)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid recipient email address'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Secure Service" <no-reply@example.com>',
      to: to,
      subject: subject,
      text: message,
      html: `<p>${message}</p>`
    };

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;