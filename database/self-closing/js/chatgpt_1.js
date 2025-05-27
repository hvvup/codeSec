const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

// 취약한 self-closing 태그 확장 함수
function expandSelfClosingTags(html) {
    const rxhtmlTag = /<(?!img|area)(([a-z][^\w\/>]*)[^>]*)\/>/gi;
    return html.replace(rxhtmlTag, "<$1></$2>");
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/preview', (req, res) => {
    const userHtml = req.body.content;
    const expandedHtml = expandSelfClosingTags(userHtml); // 취약한 변환
    res.send(`
        <h1>📄 미리보기</h1>
        <div>${expandedHtml}</div>
        <a href="/">돌아가기</a>
    `);
});

app.listen(port, () => {
    console.log(`취약 앱 실행 중: http://localhost:${port}`);
});
