const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// SQLite データベース接続
const db = new sqlite3.Database(path.join(__dirname, '../research.db'), (err) => {
    if (err) {
        console.error('データベース接続エラー:', err);
    } else {
        console.log('データベースに接続しました');
    }
});

// ミドルウェア
app.use(express.json());

// 静的ファイルを提供
app.use(express.static(path.join(__dirname, '../public')));

// ルートエンドポイントで index.html を返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// エンドポイント：研究者番号を名前から検索
app.get('/getResearcherNumber', (req, res) => {
    const name = req.query.name;

    if (!name) {
        return res.status(400).json({ error: '研究者氏名を入力してください。' });
    }

    db.get('SELECT RN FROM researcher_numbers WHERE Name = ?', [name], (err, row) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (row) {
            res.json({ researcherNumber: row.RN });
        } else {
            res.status(404).json({ error: '研究者番号が見つかりませんでした。' });
        }
    });
});

// 研究者番号から課題番号を検索
app.get('/getProjectsByResearcherNumber', (req, res) => {
    const researcherNumber = req.query.researcherNumber;

    if (!researcherNumber) {
        return res.status(400).json({ error: '研究者番号が指定されていません。' });
    }

    // `PI` と `CI` に一致する `AN` を取得
    const query = `
        SELECT DISTINCT AN FROM research_projects
        WHERE PI = ? OR CI = ?
    `;

    db.all(query, [researcherNumber, researcherNumber], (err, rows) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (rows.length > 0) {
            const projectNumbers = rows.map(row => row.AN);
            res.json({ projects: projectNumbers });
        } else {
            res.status(404).json({ error: '該当する課題番号が見つかりませんでした。' });
        }
    });
});


// サーバー起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});

