const express = require('express');
const app = express();
const router = express.Router();

app.use(express.urlencoded({ extended: false }));

router.get('/', (req, res) => {
  res.send(`
    <form method="POST">
      <input name="input" />
      <button>Submit</button>
    </form>
  `);
});

router.post('/', (req, res) => {
  res.send(`You entered: ${req.body.input}`);
});

app.use('/', router);
app.listen(3000);
