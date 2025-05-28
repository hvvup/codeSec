const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

const form = `<form method="POST"><input name="input"/><button>Send</button></form>`;

function sanitizer(req, res, next) {
  req.sanitized = (req.body.input || '').replace(/[<>"']/g, '');
  next();
}

app.get('/', (req, res) => res.send(form));

app.post('/', sanitizer, (req, res) => {
  res.send(`<p>Sanitized: ${req.sanitized}</p>`);
});

app.listen(3003);
