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
const postForm = (req, res) => res.send(`You entered: ${req.body.input}`);

app.get('/', getForm);
app.post('/', postForm);

app.listen(3000);
