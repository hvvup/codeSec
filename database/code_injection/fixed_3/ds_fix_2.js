const express = require('express');
const { evaluate } = require('mathjs');

const app = express();

app.get('/calculate', (req, res) => {
  const expr = req.query.expr;

  if (!expr) {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  try {
    // Use math.js for safe expression evaluation
    const result = evaluate(expr);
    
    // Sanitize output by converting to primitive number
    return res.json({ result: Number(result) });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});