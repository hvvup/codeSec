// secureBookLookup.js

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const libxmljs = require('libxmljs2');

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

// Parse XML using libxmljs2 (safe DOM)
const xmlDoc = libxmljs.parseXml(xmlData);

// Route: GET /book?isbn=...
app.get('/book', (req, res) => {
  const { isbn } = req.query;

  if (typeof isbn !== 'string' || isbn.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid isbn parameter.' });
  }

  try {
    const safeIsbn = isbn.trim();

    // XPath search using exact text match (XPath 1.0 safe expression)
    const xpathExpr = `/library/book[isbn[text()="${safeIsbn}"]]`;
    const nodes = xmlDoc.find(xpathExpr);

    if (nodes.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const bookNode = nodes[0];
    const titleNode = bookNode.get('title')?.text();
    const authorNode = bookNode.get('author')?.text();

    return res.json({
      isbn: safeIsbn,
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
