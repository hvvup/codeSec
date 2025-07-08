const express = require('express');
const app = express();

const user = {
  age: 25,
  score: 80
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  try {
    // with(user)로 감싸서 score, age를 직접 사용할 수 있도록
    const func = new Function('user', 'with(user) { return ' + logic + '; }');
    const result = func(user);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: 'Invalid logic' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});
