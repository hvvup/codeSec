const express = require('express');
const { marked } = require('marked');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { evaluate } = require('mathjs');
const vm = require('vm');

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
        const result = evaluate(req.body.calc.toString());
        rawHtml += `<p>Calculation result: ${result}</p>`;
      } catch {
        return res.status(400).json({ error: 'Invalid calculation expression' });
      }
    }

    if (req.body.script) {
      try {
        const script = new vm.Script(req.body.script.toString());
        const context = vm.createContext({});
        script.runInContext(context, { timeout: 1000 });
      } catch {
        return res.status(400).json({ error: 'Invalid script input' });
      }
    }

    res.json({ html: rawHtml });
  } catch (error) {
    console.error('Error processing markdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/execute', (req, res) => {
  const userCode = req.query.code || '';
  try {
    const script = new vm.Script(userCode.toString());
    const context = vm.createContext({});
    const result = script.runInContext(context, { timeout: 1000 });
    res.json({ result });
  } catch {
    res.status(400).json({ error: 'Invalid code input' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<script>alert("Error: ' + err.message + '")</script>');
});

app.listen(port, () => {
  console.log(`Markdown renderer API running on port ${port}`);
});

module.exports = app;
