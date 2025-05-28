const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

const formHTML = `
  <form method="POST" action="/">
    <input name="input" />
    <button type="submit">Send</button>
  </form>
`;

function sanitize(input) {
  return input.replace(/[<>"']/g, '');
}

app.get('/', (req, res) => {
  res.send(formHTML);
});

app.post('/', (req, res) => {
  const safe = sanitize(req.body.input || '');
  res.send(`<p>Sanitized: ${safe}</p>`);
});

app.listen(3000);
