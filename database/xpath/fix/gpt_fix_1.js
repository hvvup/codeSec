// secure-xpath-server.js

const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const morgan = require('morgan');

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

// Function to escape user input for XPath
function escapeForXPath(str) {
  // XPath string escaping method (single or concat for quotes)
  if (str.indexOf('"') === -1) {
    return `"${str}"`;
  } else if (str.indexOf("'") === -1) {
    return `'${str}'`;
  } else {
    // Contains both quotes → use concat()
    return 'concat("' + str.replace(/"/g, '", \'"\', "') + '")';
  }
}

app.get('/user/home', (req, res) => {
  const userName = req.query.userName;

  if (typeof userName !== 'string' || userName.trim() === '') {
    return res.status(400).json({ error: 'Invalid userName parameter.' });
  }

  try {
    // ✅ Secure: escape user input before building XPath query
    const escapedUserName = escapeForXPath(userName);
    const xpathExpr = `/users/user[login=${escapedUserName}]/home/text()`;
    const nodes = xpath.select(xpathExpr, doc);

    if (nodes.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: userName, home: nodes[0].nodeValue });

  } catch (err) {
    console.error('XPath query failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure XML API server running on port ${PORT}`);
});
