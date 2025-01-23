const fs = require('fs');

// JSONファイルのパス
const filePath = './test.json';

// JSONファイルを読み込む
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('ファイル読み込みエラー:', err.message);
        return;
    }

    try {
        // JSONデータをパース
        const jsonData = JSON.parse(data);

        // 領収書名を取得して表示
        console.log('領収書名:', jsonData.title);
    } catch (parseErr) {
        console.error('JSONパースエラー:', parseErr.message);
    }
});

