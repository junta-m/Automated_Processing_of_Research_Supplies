require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');
const { exec } = require('child_process');

// SQLite データベース接続
const db = new sqlite3.Database(path.join(__dirname, '../ARPS.db'), (err) => {
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

//serch: 外部apiからデータを取得
//get: local dbからデータを取得

// {{{ app.get('/getProjectsByResearcherNumber', (req, res) => {
app.get('/getProjectsByResearcherNumber', (req, res) => {
    const researcherNumber = req.query.researcherNumber;

    if (!researcherNumber) {
        return res.status(400).json({ error: '研究者番号が指定されていません。' });
    }

    const query = `
        SELECT DISTINCT pnumber FROM allocations
        WHERE PI = ? OR (CI IS NOT NULL AND CI = ?)
    `;

    db.all(query, [researcherNumber, researcherNumber], (err, rows) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (rows.length > 0) {
            const projectNumbers = rows.map(row => row.pnumber);
            console.log(`検索結果: ${JSON.stringify(projectNumbers)}`);
            res.json({ projects: projectNumbers });
        } else {
            console.error(`該当する課題番号が見つかりませんでした: 研究者番号=${researcherNumber}`);
            res.status(404).json({ error: '該当する課題番号が見つかりませんでした。' });
        }
    });
});
// }}}

// {{{ app.get('/getResearcherName', (req, res) => {
app.get('/getResearcherName', (req, res) => {
    const researcherNumber = req.query.researcherNumber;

    if (!researcherNumber) {
        return res.status(400).json({ error: '研究者番号を指定してください。' });
    }

    const query = `SELECT rname FROM researchers WHERE rnumber = ?`;

    db.get(query, [researcherNumber], (err, row) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }

        if (row) {
            console.log(`研究者情報取得成功: ${JSON.stringify(row)}`);
            res.json({ 研究者: row.rname });
        } else {
            console.error(`研究者情報が見つかりません: 研究者番号=${researcherNumber}`);
            res.json({ 研究者: 'DB未登録' });
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

    const query = `SELECT name FROM researchers WHERE Name = ?`;

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

//{{{ app.get('/getAllocation', (req, res) => {
app.get('/getAllocation', (req, res) => {
    const projectNumber = req.query.projectNumber;

    if (!projectNumber) {
        console.error("エラー: 課題番号が指定されていません。");
        return res.status(400).json({ error: '課題番号を指定してください。' });
    }

    const query = `
        SELECT distributed_campus AS 納品キャンパス,
               distributed_location AS 納品先,
               installed_campus AS 設置キャンパス,
               installed_location AS 設置先, PI, CI
        FROM allocations WHERE pnumber = ?
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

// {{{ app.get('/getProject', (req, res) => {
app.get('/getProject', (req, res) => {
    const projectNumber = req.query.projectNumber;

    if (!projectNumber) {
        return res.status(400).json({ error: '課題番号を指定してください。' });
    }

    const query = `
        SELECT ptype AS 課題種別, ptitle AS 課題名
        FROM projects WHERE pnumber = ?
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

//{{{ app.get('/searchResearcherNumber', async (req, res) => {
app.get('/searchResearcherNumber', async (req, res) => {
    let name = req.query.name;
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: '研究者氏名を入力してください。' });
    }

    name = name.replace(/\s+/g, ""); // 空白を削除
    const apiUrl = `https://nrid.nii.ac.jp/opensearch/?format=json&qg=${encodeURIComponent(name)}&appid=${process.env.KAKENAPI}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.totalResults) {
            return res.json({ message: '検索結果なし', personIds: [] });
        }

        const totalResults = data.totalResults;
        const researcherIds = data.researchers.map(r => r["id:person:erad"]);

        let processedCount = 0;
        researcherIds.forEach(personId => {
            if (Array.isArray(personId)) {
                personId = personId[0];
            }
            personId = personId.toString();

            db.get(`SELECT rnumber FROM researchers WHERE rnumber = ?`, [personId], (err, row) => {
                if (err) {
                    console.error('DBエラー:', err);
                    return;
                }
                if (!row) {
                    db.run(`INSERT INTO researchers (rnumber, rname) VALUES (?, ?)`, [personId, name], (insertErr) => {
                        if (insertErr) {
                            console.error('DB挿入エラー:', insertErr);
                        } else {
                            console.log(`新しい研究者番号を追加: rnumber=${personId}, rname=${name}`);
                        }
                    });
                }
                processedCount++;
                if (processedCount === researcherIds.length) {
                    res.json({ totalResults, researcherIds });
                }
            });
        });
    } catch (error) {
        console.error('APIエラー:', error);
        res.status(500).json({ error: 'API取得エラーが発生しました。' });
    }
});
// }}}

// サーバー起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});

