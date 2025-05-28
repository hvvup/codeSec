const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send(`
    <form method="POST">
      <input name="input" />
      <button>Submit</button>
    </form>
  `);
});

app.post('/', (req, res) => {
  const sanitized = req.body.input.replace(/[<>"']/g, '');
  res.send(`<div data-info="${sanitized}"></div>`);
});

app.listen(3000);
