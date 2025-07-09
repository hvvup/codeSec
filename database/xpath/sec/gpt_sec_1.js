// secure-xpath-server-fixed-fontoxpath.js

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { DOMParser } = require('xmldom');
const { evaluateXPathToString } = require('fontoxpath');

const app = express();
const PORT = 3000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// Static XML data
const xmlData = `
<users>
  <user>
    <login>alice</login>
    <home>/home/alice</home>
  </user>
  <user>
    <login>bob</login>
    <home>/home/bob</home>
  </user>
</users>
`;

const doc = new DOMParser().parseFromString(xmlData);

app.get('/user/home', (req, res) => {
  const userName = req.query.userName;

  if (typeof userName !== 'string' || userName.trim() === '') {
    return res.status(400).json({ error: 'Invalid userName parameter.' });
  }

  try {
    const xpathExpr = `/users/user[login = $userName]/home/text()`;

    // ✅ SAFE: Variable binding with fontoxpath
    const result = evaluateXPathToString(
      xpathExpr,
      doc,
      null,
      null,
      { userName: userName }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: userName, home: result });

  } catch (err) {
    console.error('XPath query failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure XML API server running on port ${PORT}`);
});
