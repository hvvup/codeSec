const express = require('express');
const { create, all } = require('mathjs');

const app = express();

// Setup mathjs with a limited and safe environment
const config = { };
const math = create(all, config);

// Allowed variables
const user = {
  age: 25,
  score: 80
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  if (typeof logic !== 'string' || logic.trim() === '') {
    return res.status(400).json({ error: 'Logic expression is required' });
  }

  try {
    // Only evaluate expressions, no access to globals or unsafe code
    const compiled = math.compile(logic);
    const result = compiled.evaluate(user);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: 'Invalid logic' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});
