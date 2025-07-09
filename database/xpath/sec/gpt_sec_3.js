// verifyEmail.js

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { DOMParser } = require('xmldom');
const { evaluateXPathToString } = require('fontoxpath'); // 안전한 XPath 라이브러리

const app = express();
const PORT = 3000;

// Middleware for security and logging
app.use(helmet());
app.use(morgan('combined'));

// Embedded XML user dataset
const xmlData = `
<users>
  <user>
    <email>alice@example.com</email>
    <verified>true</verified>
  </user>
  <user>
    <email>bob@example.com</email>
    <verified>false</verified>
  </user>
  <user>
    <email>charlie@example.com</email>
    <verified>true</verified>
  </user>
</users>
`;

// Parse XML string into DOM
const xmlDoc = new DOMParser().parseFromString(xmlData);

// Route: GET /verify/email?email=someone@example.com
app.get('/verify/email', (req, res) => {
  const email = req.query.email;

  // Input validation
  if (typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing email parameter.' });
  }

  try {
    // Use variable binding to avoid XPath Injection
    const isVerifiedStr = evaluateXPathToString(
      `/users/user[email=$email]/verified/text()`,
      xmlDoc,
      null,        // domFacade (null is fine for xmldom)
      null,        // variablesInScope (unused)
      { email: email.trim() } // variable bindings
    );

    if (!isVerifiedStr) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const isVerified = isVerifiedStr.trim() === 'true';
    return res.status(200).json({ email, verified: isVerified });
  } catch (err) {
    console.error('XPath evaluation error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Secure Email Verification API running at http://localhost:${PORT}`);
});
