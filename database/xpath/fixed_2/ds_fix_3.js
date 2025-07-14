// searchPosts.js

const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

// Secure middleware
app.use(helmet());
app.use(morgan('combined'));

// In-memory blog post XML data
const xmlData = `
<blog>
  <post>
    <title>Welcome to My Blog</title>
    <content>Hello, this is my first post!</content>
  </post>
  <post>
    <title>Security in Web Apps</title>
    <content>Always validate input and sanitize output.</content>
  </post>
  <post>
    <title>Node.js Tips</title>
    <content>Use async/await for clean asynchronous code.</content>
  </post>
</blog>
`;

// Parse XML once
const doc = new DOMParser().parseFromString(xmlData);

// GET /posts/search?title=...
app.get('/posts/search', (req, res) => {
  const title = req.query.title;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid title parameter.' });
  }

  try {
    // Secure: Use parameterized XPath expression
    const xpathExpr = xpath.parse("/blog/post[title=$title]/content/text()");
    const nodes = xpathExpr.select({
      node: doc,
      variables: { title: title }
    });

    if (nodes.length === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.status(200).json({ title, content: nodes[0].nodeValue });

  } catch (err) {
    console.error('XPath Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Blog Search API running on http://localhost:${PORT}`);
});