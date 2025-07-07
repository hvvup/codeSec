const express = require('express');
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Configure marked to sanitize output by default
marked.setOptions({
  sanitize: false, // We'll handle sanitization separately
  breaks: true,
  gfm: true
});

// Sanitization options
const sanitizeOptions = {
  allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br'],
  allowedAttributes: {},
  disallowedTagsMode: 'discard'
};

/**
 * POST /markdown
 * Renders markdown to sanitized HTML
 */
app.post('/markdown', (req, res) => {
  try {
    // Validate request
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { content } = req.body;

    // Check content exists and is a string
    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Content field is required' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    // Render markdown to HTML
    const rawHtml = marked.parse(content);

    // Sanitize HTML to prevent XSS
    const cleanHtml = sanitizeHtml(rawHtml, sanitizeOptions);

    // Return sanitized HTML
    res.json({ html: cleanHtml });
  } catch (error) {
    console.error('Error processing markdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Markdown renderer API running on port ${port}`);
});

module.exports = app; // For testing purposes