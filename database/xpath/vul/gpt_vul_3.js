// verifyEmail.js

const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const morgan = require('morgan');

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

// Escaping function for XPath string literals (avoids injection)
function escapeForXPath(str) {
  if (str.includes('"') && str.includes("'")) {
    return 'concat("' + str.replace(/"/g, '", \'"\', "') + '")';
  }
  if (str.includes('"')) return `'${str}'`;
  return `"${str}"`;
}

// Route: GET /verify/email?email=someone@example.com
app.get('/verify/email', (req, res) => {
  const email = req.query.email;

  // Input validation
  if (typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing email parameter.' });
  }

  try {
    // Vulnerable: user input directly concatenated into XPath expression
    const xpathExpr = "/users/user[email=\"" + email + "\"]/verified/text()";

    const nodes = xpath.select(xpathExpr, xmlDoc);

    if (nodes.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const isVerified = nodes[0].nodeValue.trim() === 'true';
    return res.status(200).json({ email, verified: isVerified });
  } catch (err) {
    console.error('XPath error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Secure Email Verification API running at http://localhost:${PORT}`);
});
