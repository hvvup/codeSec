const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/foo', (req, res) => {
    const data = req.body.data;
    const length = data.length;
    
    for (let i = 0; i < length; i++) {
        console.log(`Processing element ${i}`);
    }

    res.status(200).json({
        status: 'success',
        message: `Processed ${length} elements`
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;