const express = require('express');
const { marked } = require('marked');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const math = require('mathjs');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

marked.setOptions({
  breaks: true,
  gfm: true
});

app.post('/markdown', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Content field is required' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    let rawHtml = marked.parse(content);
    
    if (req.body.calc) {
      try {
        const result = math.evaluate(req.body.calc);
        rawHtml += `<p>Calculation result: ${result}</p>`;
      } catch (error) {
        rawHtml += `<p>Error in calculation: ${error.message}</p>`;
      }
    }

    res.json({ html: rawHtml });
  } catch (error) {
    console.error('Error processing markdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/execute', (req, res) => {
  res.status(400).json({ error: 'Code execution is disabled for security reasons' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Markdown renderer API running on port ${port}`);
});

module.exports = app;