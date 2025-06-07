const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/foo', (req, res) => {
    const input = req.body.data;
    let result = [];

    for (let i = 0; i < input.length; i++) {
        result.push(input[i]);
    }

    res.json({
        originalLength: input.length,
        processedData: result
    });
});

app.listen(3000);