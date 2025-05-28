const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

const formHTML = `<form method="POST"><input name="input" /><button>Send</button></form>`;
const sanitize = str => str.replace(/[<>"']/g, '');

function renderForm(req, res) {
  res.send(formHTML);
}

function handleSubmit(req, res) {
  const result = sanitize(req.body.input || '');
  res.send(`<p>Sanitized: ${result}</p>`);
}

app.get('/', renderForm);
app.post('/', handleSubmit);

app.listen(3001);
