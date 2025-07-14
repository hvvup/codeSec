const express = require('express');
const mathjs = require('mathjs'); // Safe math evaluation library
const app = express();

// Middleware to validate expression format
const validateExpr = (req, res, next) => {
  const expr = req.query.expr;
  if (!expr || typeof expr !== 'string') {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  // Basic validation - only allow math expressions
  if (!/^[\d\s+\-*\/()%.^]+$/.test(expr)) {
    return res.status(400).json({ error: 'Expression contains invalid characters' });
  }

  next();
};

app.get('/calculate', validateExpr, (req, res) => {
  const expr = req.query.expr;

  try {
    // Safe evaluation using mathjs instead of eval
    const result = mathjs.evaluate(expr);

    // Return result with proper JSON encoding (express.json() handles this)
    return res.json({ 
      result: typeof result === 'number' ? result : String(result) 
    });
  } catch (err) {
    return res.status(400).json({ 
      error: 'Invalid expression',
      details: err.message 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});