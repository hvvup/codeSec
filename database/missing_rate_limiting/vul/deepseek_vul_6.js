const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

const validateEmailInput = (req, res, next) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, or message' });
  }

  if (!validator.isEmail(to)) {
    return res.status(400).json({ error: 'Invalid recipient email format' });
  }

  if (subject.length > 100) {
    return res.status(400).json({ error: 'Subject too long (max 100 characters)' });
  }
  const cleanSubject = sanitizeHtml(subject, { allowedTags: [], allowedAttributes: {} });

  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
  }
  const cleanMessage = sanitizeHtml(message, { 
    allowedTags: ['b', 'i', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {}
  });

  req.cleanEmail = {
    to: validator.normalizeEmail(to),
    subject: cleanSubject,
    text: cleanMessage.replace(/<[^>]*>?/gm, ''),
    html: cleanMessage,
  };

  next();
};

app.post('/send-email', validateEmailInput, async (req, res) => {
  try {
    const { to, subject, text, html } = req.cleanEmail;

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;