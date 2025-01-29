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

// ルートエンドポイント
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

//{{{ app.post('/updateProjectInfo', (req, res) => {
app.post('/updateProjectInfo', (req, res) => {
    const {
        研究課題番号, 課題種別, 課題名, 代表者, 分担者,
        納品キャンパス, 納品先, 設置キャンパス, 設置先
    } = req.body;

    if (!研究課題番号 || !代表者) {
        return res.status(400).json({ error: '課題番号と代表者の研究者番号は必須です。' });
    }

    // `PI` または `CI` が一致する既存レコードを検索
    const checkQuery = `
        SELECT AN FROM research_projects
        WHERE AN = ? AND (PI = ? OR CI = ?)
    `;

    db.get(checkQuery, [研究課題番号, 代表者, 分担者], (err, row) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (row) {
            // レコードが存在する場合は更新
            const updateQuery = `
                UPDATE research_projects
                SET AT = ?, AName = ?, PI = ?, CI = ?,
                    Distributed_Campus = ?, Distributed_Location = ?,
                    Installed_Campus = ?, Installed_Location = ?
                WHERE AN = ?
            `;

            db.run(updateQuery, [
                課題種別, 課題名, 代表者, 分担者,
                納品キャンパス, 納品先, 設置キャンパス, 設置先,
                研究課題番号
            ], function (updateErr) {
                if (updateErr) {
                    console.error('更新エラー:', updateErr);
                    return res.status(500).json({ error: '更新に失敗しました。' });
                }
                res.json({ message: '課題情報を更新しました。' });
            });

        } else {
            // レコードが存在しない場合は追加
            const insertQuery = `
                INSERT INTO research_projects (AN, AT, AName, PI, CI,
                    Distributed_Campus, Distributed_Location, Installed_Campus, Installed_Location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(insertQuery, [
                研究課題番号, 課題種別, 課題名, 代表者, 分担者,
                納品キャンパス, 納品先, 設置キャンパス, 設置先
            ], function (insertErr) {
                if (insertErr) {
                    console.error('挿入エラー:', insertErr);
                    return res.status(500).json({ error: '課題情報の追加に失敗しました。' });
                }
                res.json({ message: '新しい課題情報を追加しました。' });
            });
        }
    });
});
// }}}

// {{{ app.get('/getProjectsByResearcherNumber', (req, res) => {
app.get('/getProjectsByResearcherNumber', (req, res) => {
    const researcherNumber = req.query.researcherNumber;

    if (!researcherNumber) {
        return res.status(400).json({ error: '研究者番号が指定されていません。' });
    }

    const query = `
        SELECT DISTINCT AN FROM research_projects
        WHERE PI = ? OR (CI IS NOT NULL AND CI = ?)
    `;

    db.all(query, [researcherNumber, researcherNumber], (err, rows) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (rows.length > 0) {
            const projectNumbers = rows.map(row => row.AN);
            console.log(`検索結果: ${JSON.stringify(projectNumbers)}`);
            res.json({ projects: projectNumbers });
        } else {
            console.error(`該当する課題番号が見つかりませんでした: 研究者番号=${researcherNumber}`);
            res.status(404).json({ error: '該当する課題番号が見つかりませんでした。' });
        }
    });
});
// }}}

//{{{ app.get('/getResearcherNumber', (req, res) => {
app.get('/getResearcherNumber', (req, res) => {
    const name = req.query.name;

    if (!name || name.trim() === "") {
        return res.status(400).json({ error: '研究者氏名を入力してください。' });
    }

    const query = `SELECT RN FROM researcher_numbers WHERE Name = ?`;

    db.get(query, [name], (err, row) => {
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
// }}}

//{{{ app.get('/fetchProjectInfo', (req, res) => {
app.get('/fetchProjectInfo', (req, res) => {
    const projectNumber = req.query.projectNumber;

    if (!projectNumber) {
        console.error("エラー: 課題番号が指定されていません。");
        return res.status(400).json({ error: '課題番号を指定してください。' });
    }

    const query = `
        SELECT AT AS 課題種別, AName AS 課題名, Distributed_Campus AS 納品キャンパス,
               Distributed_Location AS 納品先, Installed_Campus AS 設置キャンパス, Installed_Location AS 設置先, PI, CI
        FROM research_projects WHERE AN = ?
    `;

    db.get(query, [projectNumber], (err, row) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (row) {
            console.log(`課題情報取得成功: ${JSON.stringify(row)}`);
            res.json(row);
        } else {
            console.error(`課題情報が見つかりません: 課題番号=${projectNumber}`);
            res.status(404).json({ error: 'DB未登録' });
        }
    });
});
// }}}

//{{{ app.get('/fetchResearcherName', (req, res) => {
app.get('/fetchResearcherName', (req, res) => {
    const researcherId = req.query.researcherId;

    if (!researcherId) {
        return res.status(400).json({ error: '研究者番号を指定してください。' });
    }

    console.log(`研究者情報の検索開始: RN=${researcherId}`);

    const query = `SELECT Name FROM researcher_numbers WHERE RN = ?`;

    db.get(query, [researcherId], (err, row) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (row) {
            console.log(`研究者情報取得成功: RN=${researcherId}, Name=${row.Name}`);
            res.json({ name: row.Name });
        } else {
            console.error(`研究者情報が見つかりません: RN=${researcherId}`);
            res.status(404).json({ error: 'DB未登録' });
        }
    });
});
// }}}

// サーバー起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});

