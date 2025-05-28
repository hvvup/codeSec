const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

const form = `<form method="POST"><input name="input"/><button>Send</button></form>`;
const clean = s => s.replace(/[<>"']/g, '');

app.get('/', (_, res) => res.send(form));
app.post('/', (req, res) => res.send(`<p>Sanitized: ${clean(req.body.input || '')}</p>`));

app.listen(3004);
