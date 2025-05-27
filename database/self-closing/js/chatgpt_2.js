const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));

function showForm(req, res) {
  res.send(`
    <form method="POST">
      <input name="input" />
      <button>Submit</button>
    </form>
  `);
}

function handleInput(req, res) {
  const input = req.body.input;
  res.send(`You entered: ${input}`);
}

app.get('/', showForm);
app.post('/', handleInput);

app.listen(3000);
