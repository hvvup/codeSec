const express = require('express');
const { create, all } = require('mathjs');

const app = express();
const math = create(all);

// ⚠️ DO NOT disable 'eval' or 'parse' — they are required internally
math.import({
  import: () => { throw new Error('import is disabled'); },
  createUnit: () => { throw new Error('createUnit is disabled'); },
  simplify: () => { throw new Error('simplify is disabled'); },
  derivative: () => { throw new Error('derivative is disabled'); }
}, { override: true });

app.get('/calculate', (req, res) => {
  const expr = req.query.expr;

  if (typeof expr !== 'string' || expr.trim() === '') {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  try {
    const result = math.evaluate(expr);

    // Whitelist result types to avoid unsafe serialization
    if (typeof result === 'number' || typeof result === 'boolean' || typeof result === 'string') {
      return res.json({ result });
    } else {
      return res.status(400).json({ error: 'Unsupported result type' });
    }
  } catch (err) {
    console.error('[ERROR]', err.message);
    return res.status(400).json({ error: 'Invalid expression' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}/calculate?expr=2*(3+1)`);
});
