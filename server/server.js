require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');
const { exec } = require('child_process');
const xml2js = require("xml2js");

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
//update: local dbにデータを更新

// {{{ app.post('/updateProject', (req, res) => {
app.post('/updateProject', (req, res) => {
    const { projectNumber, projectType, projectTitle } = req.body;

    if (!projectNumber || !projectType || !projectTitle) {
        return res.status(400).json({ error: '全ての項目を入力してください。' });
    }

    const query = `
        INSERT INTO projects (pnumber, ptype, ptitle)
        VALUES (?, ?, ?)
        ON CONFLICT(pnumber) DO UPDATE SET
        ptype = excluded.ptype,
        ptitle = excluded.ptitle
    `;

    db.run(query, [projectNumber, projectType, projectTitle], function (err) {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }
        res.json({ message: '課題情報が更新されました。' });
    });
});
// }}}

// {{{ app.post('/updateAllocation', (req, res) => {
app.post('/updateAllocation', (req, res) => {
    const { projectNumber, distributedCampus, distributedLocation, installedCampus, installedLocation, PI, CI } = req.body;

    if (!projectNumber || !distributedCampus || !distributedLocation || !installedCampus || !installedLocation) {
        return res.status(400).json({ error: '全ての項目を入力してください。' });
    }

    const query = `
        INSERT INTO allocations (pnumber, distributed_campus, distributed_location, installed_campus, installed_location, PI, CI)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pnumber) DO UPDATE SET
        distributed_campus = excluded.distributed_campus,
        distributed_location = excluded.distributed_location,
        installed_campus = excluded.installed_campus,
        installed_location = excluded.installed_location,
        PI = excluded.PI,
        CI = excluded.CI
    `;

    db.run(query, [projectNumber, distributedCampus, distributedLocation, installedCampus, installedLocation, PI, CI], function (err) {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }
        res.json({ message: '課題割り当て情報が更新されました。' });
    });
});
// }}}

// {{{ app.post('/updateResearcher', (req, res) => {
app.post('/updateResearcher', (req, res) => {
    const { researcherNumber, researcherName } = req.body;

    if (!researcherNumber || !researcherName) {
        return res.status(400).json({ error: '研究者番号と氏名を入力してください。' });
    }

    const query = `
        INSERT INTO researchers (rnumber, rname)
        VALUES (?, ?)
        ON CONFLICT(rnumber) DO UPDATE SET
        rname = excluded.rname
    `;

    db.run(query, [researcherNumber, researcherName], function (err) {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'データベースエラーが発生しました。' });
        }
        res.json({ message: '研究者情報が更新されました。' });
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

//{{{ app.post("/searchProject", async (req, res) => {
app.post("/searchProject", async (req, res) => {
    try {
        console.log("searchProject API called with request body:", req.body);

        const { researcherNumber } = req.body;
        if (!researcherNumber) {
            return res.status(400).json({ error: "研究者番号が必要です" });
        }

        // KAKEN API へのリクエスト
        const kakenApiUrl = `https://kaken.nii.ac.jp/opensearch/?format=xml&qm=${encodeURIComponent(researcherNumber)}&c1=granted&appid=${process.env.KAKENAPI}`;
        const response = await axios.get(kakenApiUrl);

        if (response.status !== 200) {
            throw new Error(`KAKEN API エラー: ${response.status} ${response.statusText}`);
        }

        const xmlData = response.data;
        console.log("取得したXMLデータ:", xmlData); // デバッグ用

        if (!xmlData || xmlData.trim() === "") {
            throw new Error("KAKEN API からのレスポンスが空です");
        }

        // XML を JSON に変換
        xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error("XML 解析エラー:", err);
                return res.status(500).json({ error: "XML の解析に失敗しました" });
            }

            const grants = result?.feed?.entry || [];
            if (!grants.length) {
                return res.status(404).json({ error: "KAKEN API に課題番号がありません" });
            }

            let projectNumbers = [];
            grants.forEach(grant => {
                if (grant["grantAward"]) {
                    const awardNumber = grant["grantAward"]["$"]["awardNumber"];
                    if (awardNumber) {
                        projectNumbers.push(awardNumber);
                    }
                }
            });

            console.log("取得した課題番号:", projectNumbers);

            if (!projectNumbers.length) {
                return res.status(404).json({ error: "課題番号が見つかりませんでした" });
            }

            res.json({ projectNumbers });
        });

    } catch (error) {
        console.error("サーバーエラー:", error);
        res.status(500).json({ error: error.message });
    }
});

//}}}

// サーバー起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});

