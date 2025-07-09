const express = require('express');

const app = express();

app.get('/calculate', (req, res) => {
  const expr = req.query.expr;

  if (!expr) {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  try {
    // CWE-094, CWE-095: Direct eval on user input without validation
    const result = eval(expr);

    // CWE-116: Improper encoding or escaping of output by directly returning result in JSON
    return res.json({ result: result });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});
