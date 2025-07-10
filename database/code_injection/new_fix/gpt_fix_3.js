const express = require('express');
const app = express();
const math = require('mathjs');

const user = {
  age: 25,
  score: 80
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  try {
    // Parse and safely evaluate logic using mathjs with limited scope
    const compiled = math.compile(logic);
    const result = compiled.evaluate(user);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: 'Invalid logic expression' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});
