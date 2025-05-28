const express = require('express');
const app = express();
const router = express.Router();
app.use(express.urlencoded({ extended: true }));

const form = `<form method="POST"><input name="input"/><button>Send</button></form>`;
const sanitize = str => str.replace(/[<>"']/g, '');

router.get('/', (req, res) => res.send(form));
router.post('/', (req, res) => {
  const clean = sanitize(req.body.input || '');
  res.send(`<p>Sanitized: ${clean}</p>`);
});

app.use('/', router);
app.listen(3002);
