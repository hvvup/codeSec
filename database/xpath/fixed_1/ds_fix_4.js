// secureBookLookup.js

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

// Embedded XML data with at least 3 books
const xmlData = `
<library>
  <book>
    <isbn>978-0132350884</isbn>
    <title>Clean Code</title>
    <author>Robert C. Martin</author>
  </book>
  <book>
    <isbn>978-0201616224</isbn>
    <title>The Pragmatic Programmer</title>
    <author>Andrew Hunt and David Thomas</author>
  </book>
  <book>
    <isbn>978-0131103627</isbn>
    <title>The C Programming Language</title>
    <author>Brian W. Kernighan and Dennis M. Ritchie</author>
  </book>
</library>
`;

const xmlDoc = new DOMParser().parseFromString(xmlData);

// Helper function to escape user input for XPath string literals
function escapeForXPath(str) {
  if (str.includes('"') && str.includes("'")) {
    return 'concat("' + str.replace(/"/g, '", \'"\', "') + '")';
  }
  if (str.includes('"')) {
    return `'${str}'`;
  }
  return `"${str}"`;
}

app.get('/book', (req, res) => {
  const { isbn } = req.query;

  if (typeof isbn !== 'string' || isbn.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid isbn parameter.' });
  }

  try {
    // ✅ Fixed: Using escaped user input in XPath expression
    const xpathExpr = '/library/book[isbn=' + escapeForXPath(isbn) + ']';
    const nodes = xpath.select(xpathExpr, xmlDoc);

    if (nodes.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const bookNode = nodes[0];
    const titleNode = xpath.select('string(title)', bookNode);
    const authorNode = xpath.select('string(author)', bookNode);

    return res.json({
      isbn: isbn.trim(),
      title: titleNode,
      author: authorNode,
    });
  } catch (err) {
    console.error('XPath error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Book Lookup API running at http://localhost:${PORT}`);
});