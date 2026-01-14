const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', (req, res) => {
        db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
            if (err) return res.status(500).send("Database error");
            res.json(rows);
        });
    });

    router.post('/', (req, res) => {
        const { title, content } = req.body;
        const stmt = db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
        stmt.run(title, content, function(err) {
            if (err) return res.status(500).send("Insert error");
            res.status(201).json({ id: this.lastID });
        });
        stmt.finalize();
    });

    return router;
};
