const express = require('express');
const app = express();
const safeEval = require('safe-eval');

const user = {
  age: 25,
  score: 80
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  // Validate input contains only safe characters
  if (!/^[0-9+\-*\/<>=&| ]+$/.test(logic)) {
    return res.status(400).json({ error: 'Invalid logic expression' });
  }

  try {
    const context = { user };
    const result = safeEval(logic, context);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: 'Invalid logic' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});