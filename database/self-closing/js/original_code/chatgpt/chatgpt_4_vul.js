const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));

app.route('/')
  .get((req, res) => {
    res.send(`
      <form method="POST">
        <input name="input" />
        <button>Submit</button>
      </form>
    `);
  })
  .post((req, res) => {
    const sanitized = req.body.input.replace(/[<>"']/g, '');
    res.send(`<br title="${sanitized}">`);
  });

app.listen(3000);
