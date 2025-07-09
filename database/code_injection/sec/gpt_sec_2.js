// app.js
//
// Secure Node.js + Express server that safely evaluates math expressions from query parameter.
// Uses `mathjs` for safe parsing and evaluation.
// Validates input to allow only digits, spaces, parentheses, and + - * / operators.
// Returns JSON with result or error.
//
// To run:
// npm install express mathjs
// node app.js
//
// Test example:
// GET http://localhost:3000/calculate?expr=2*(3+1)

const express = require('express');
const { create, all } = require('mathjs');

const app = express();

// Create mathjs instance with default config
const math = create(all);

// Allowed characters regexp: digits, spaces, parentheses, + - * / operators
const VALID_EXPR_REGEX = /^[0-9+\-*/()\s]+$/;

// Validate expression to allow only safe characters
function isValidExpression(expr) {
  if (typeof expr !== 'string') return false;
  return VALID_EXPR_REGEX.test(expr);
}

// Parse and evaluate expression safely
function evaluateExpression(expr) {
  // mathjs throws on invalid expressions
  return math.evaluate(expr);
}

app.get('/calculate', (req, res) => {
  const expr = req.query.expr;

  if (!expr || !isValidExpression(expr)) {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  try {
    const result = evaluateExpression(expr);
    // mathjs can return BigNumber or Fraction - convert to JS number if possible
    const value = typeof result === 'number' ? result : result.toNumber?.() ?? result;

    if (typeof value !== 'number' || !isFinite(value)) {
      return res.status(400).json({ error: 'Invalid expression' });
    }

    return res.json({ result: value });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});
