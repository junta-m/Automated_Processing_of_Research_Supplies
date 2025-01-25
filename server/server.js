const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3001;

// Puppeteerブラウザインスタンスを保持する変数
let browser = null;

// ブラウザの初期化関数
async function initializeBrowser() {
    try {
        if (!browser) {
            console.log('Initializing browser...');
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined
            });
            console.log('Browser initialized successfully');
        }
        return browser;
    } catch (error) {
        console.error('Browser initialization error:', error);
        throw error;
    }
}

// プロセス終了時にブラウザを閉じる
process.on('exit', async () => {
    if (browser) {
        await browser.close();
    }
});

// SQLiteデータベースの設定
const db = new sqlite3.Database('research.db', (err) => {
    if (err) {
        console.error('データベース接続エラー:', err);
    } else {
        console.log('データベースに接続しました');
        initializeDatabase();
    }
});

// データベースの初期化
function initializeDatabase() {
    db.serialize(() => {
        // 研究者テーブル
        db.run(`CREATE TABLE IF NOT EXISTS researchers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )`);

        // 科研費テーブル
        db.run(`CREATE TABLE IF NOT EXISTS research_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_number TEXT NOT NULL,
            project_type TEXT NOT NULL,
            representative_id TEXT NOT NULL,
            contributor_id TEXT,
            FOREIGN KEY (representative_id) REFERENCES researchers(id),
            FOREIGN KEY (contributor_id) REFERENCES researchers(id)
        )`);
    });
}

// ミドルウェアの設定
app.use(express.static('public'));
app.use(express.json());

// PDFアップロード用の設定
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// APIエンドポイント

// PDF アップロード
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        // ここでPDFの処理とOCRを実行
        // 仮のレスポンスデータ
        const data = {
            items: [
                {
                    product_name: "サンプル商品",
                    provider: "サンプルメーカー",
                    model: "ABC-123",
                    number: 1,
                    unite_price: 1000,
                    total_price: 1000
                }
            ]
        };
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'PDFの処理中にエラーが発生しました' });
    }
});

// 研究者氏名から研究者番号を検索
app.get('/api/researcher/search-by-name', async (req, res) => {
    console.log('\n=== 研究者検索リクエスト開始 ===');
    const { name } = req.query;
    console.log('受信した検索パラメータ:', {
        rawQuery: req.query,
        name: name,
        decodedName: decodeURIComponent(name)
    });

    if (!name) {
        console.log('エラー: 研究者名が指定されていません');
        return res.status(400).json({ error: '研究者氏名を入力してください' });
    }

    let page = null;
    try {
        console.log('ブラウザの初期化を開始...');
        // ブラウザの初期化
        browser = await initializeBrowser();
        console.log('ブラウザの初期化完了');

        // 新しいページを開く
        console.log('新しいページを作成中...');
        page = await browser.newPage();
        console.log('新しいページの作成完了');

        // デバッグ用にブラウザのコンソールログを取得
        page.on('console', msg => console.log('Browser Console:', msg.text()));

        // ページの設定
        console.log('ページの設定を構成中...');
        await page.setDefaultNavigationTimeout(30000);
        await page.setViewport({ width: 1280, height: 800 });
        console.log('ページの設定完了');

        // NRIDの検索ページにアクセス
        const url = `https://nrid.nii.ac.jp/search/?qg=${encodeURIComponent(name)}&qh=龍谷大学`;
        console.log('アクセスするURL:', url);

        console.log('ページの読み込みを開始...');
        await page.goto(url, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });
        console.log('ページの読み込み完了');

        // ページ読み込み完了まで待機
        await page.waitForTimeout(2000);
        console.log('Page loaded, searching for researcher info...');

        // ページのHTMLを取得してログに出力
        const pageContent = await page.content();
        console.log('Page content length:', pageContent.length);

        // 研究者情報を取得（複数の方法を試行）
        const researcherInfo = await page.evaluate((searchName) => {
            console.log('Searching for:', searchName);

            // 方法1: リストコンテナから検索
            const listItems = Array.from(document.querySelectorAll('.listContainer li, .search-results li, .researcher-list li'));
            console.log('Found list items:', listItems.length);

            // 方法2: チェックボックスから検索
            const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][value^="4"]'));
            console.log('Found checkboxes:', checkboxes.length);

            // 方法3: リンクから検索
            const links = Array.from(document.querySelectorAll('a'));
            console.log('Found links:', links.length);

            // すべての要素をテキストで検索
            for (const element of [...listItems, ...links]) {
                const text = element.textContent.trim();
                console.log('Checking element:', text);

                if (text.includes(searchName)) {
                    console.log('Found matching name in:', text);

                    // 研究者番号を探す（複数のパターンに対応）
                    const patterns = [
                        /\((\d{8})\)/,           // (12345678)
                        /ID[:：]?\s*(\d{8})/i,   // ID: 12345678
                        /研究者番号[:：]?\s*(\d{8})/ // 研究者番号: 12345678
                    ];

                    for (const pattern of patterns) {
                        const match = text.match(pattern);
                        if (match) {
                            console.log('Found ID with pattern:', pattern, match[1]);
                            return { id: match[1], name: searchName };
                        }
                    }

                    // チェックボックスの値を確認
                    const nearbyCheckbox = element.querySelector('input[type="checkbox"]') ||
                        element.parentElement.querySelector('input[type="checkbox"]');

                    if (nearbyCheckbox && nearbyCheckbox.value.match(/^\d{8}$/)) {
                        console.log('Found ID from checkbox:', nearbyCheckbox.value);
                        return { id: nearbyCheckbox.value, name: searchName };
                    }
                }
            }

            // チェックボックスの直接検索
            for (const checkbox of checkboxes) {
                const parentText = checkbox.parentElement.textContent.trim();
                if (parentText.includes(searchName)) {
                    console.log('Found ID from checkbox value:', checkbox.value);
                    return { id: checkbox.value, name: searchName };
                }
            }

            console.log('No matching researcher found');
            return null;
        }, name);

        if (!researcherInfo) {
            console.log('Researcher not found in evaluation');
            // ページのスクリーンショットを保存（デバッグ用）
            await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
            return res.status(404).json({ error: '研究者が見つかりません' });
        }

        console.log('Found researcher:', researcherInfo);

        // データベースに研究者情報を保存
        db.run('INSERT OR REPLACE INTO researchers (id, name) VALUES (?, ?)',
            [researcherInfo.id, researcherInfo.name],
            (err) => {
                if (err) {
                    console.error('Database Error:', err);
                }
            }
        );

        res.json({ id: researcherInfo.id });
    } catch (error) {
        console.error('Detailed Error:', error);
        // エラー時もスクリーンショットを保存
        if (page) {
            await page.screenshot({ path: 'error-screenshot.png', fullPage: true }).catch(console.error);
        }
        res.status(500).json({
            error: '研究者情報の取得に失敗しました',
            details: error.message
        });
    } finally {
        if (page) {
            await page.close().catch(console.error);
        }
    }
});

// 研究者情報の取得（より一般的なルートを後に定義）
app.get('/api/researcher/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM researchers WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'データベースエラー' });
        }
        if (!row) {
            return res.status(404).json({ error: '研究者が見つかりません' });
        }
        res.json(row);
    });
});

// 課題検索
app.get('/api/project/search', (req, res) => {
    const { query } = req.query;

    db.get(`
        SELECT 
            rp.project_number,
            rp.project_type,
            r1.name as representative_name,
            r2.name as contributor_name
        FROM research_projects rp
        LEFT JOIN researchers r1 ON rp.representative_id = r1.id
        LEFT JOIN researchers r2 ON rp.contributor_id = r2.id
        WHERE rp.project_number LIKE ?
    `, [`%${query}%`], (err, row) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'データベースエラー' });
        }
        if (!row) {
            return res.status(404).json({ error: '課題が見つかりません' });
        }

        res.json({
            title: `${row.project_type} ${row.project_number}`,
            representative: row.representative_name,
            contributor: row.contributor_name
        });
    });
});

// サーバーの起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
}); 