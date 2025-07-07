const express = require('express');
const app = express();

const user = {
  age: 25,
  score: 80
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  try {
    const func = new Function('user', 'return ' + logic);
    const result = func(user);
    res.json({ result });
  } catch {
    res.status(400).json({ error: 'Invalid logic' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});
