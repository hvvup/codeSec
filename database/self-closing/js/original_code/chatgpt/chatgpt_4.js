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
    res.send(`You entered: ${req.body.input}`);
  });

app.listen(3000);
