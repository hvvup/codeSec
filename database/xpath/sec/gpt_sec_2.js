// searchPosts.js

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { evaluateXPathToString } = require('fontoxpath');
const { DOMParser } = require('@xmldom/xmldom');

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

// Parse XML once using @xmldom/xmldom
const doc = new DOMParser().parseFromString(xmlData);

// GET /posts/search?title=...
app.get('/posts/search', (req, res) => {
  const title = req.query.title;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid title parameter.' });
  }

  try {
    const content = evaluateXPathToString(
      '/blog/post[title = $title]/content',
      doc,
      null,
      null,
      {
        title: title  // variable substitution for safety
      }
    );

    if (!content) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.status(200).json({ title, content });

  } catch (err) {
    console.error('XPath Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Blog Search API running on http://localhost:${PORT}`);
});
