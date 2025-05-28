const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));

const formHtml = `
  <form method="POST">
    <input name="input" />
    <button>Submit</button>
  </form>
`;

const getForm = (_, res) => res.send(formHtml);
const postForm = (req, res) => {
  const sanitized = req.body.input.replace(/[<>"']/g, '');
  res.send(`<meta data-tag="${sanitized}">`);
};

app.get('/', getForm);
app.post('/', postForm);

app.listen(3000);
