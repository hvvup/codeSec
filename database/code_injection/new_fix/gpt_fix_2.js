const express = require('express');
const { evaluate } = require('mathjs'); // Safe math expression evaluator

const app = express();

app.get('/calculate', (req, res) => {
  const expr = req.query.expr;

  if (!expr) {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  try {
    // Safely evaluate arithmetic expression using mathjs
    const result = evaluate(expr);

    // Properly escape/encode output in JSON
    return res.json({ result: result });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});
