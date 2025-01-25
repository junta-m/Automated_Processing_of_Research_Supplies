// node-fetchの動的インポートを使用
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// 研究者名を指定
const researcherName = "山田 太郎"; // 検索する研究者名を入力

// Kaken OpenSearch APIのエンドポイント
const apiUrl = `https://kaken.nii.ac.jp/api/opensearch?q=${encodeURIComponent(researcherName)}&format=json`;

// APIリクエストを実行
async function fetchResearcherId() {
  try {
    // APIリクエストを送信
    const response = await fetch(apiUrl);

    // レスポンスが正常か確認
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    // レスポンスデータをJSON形式で取得
    const data = await response.json();

    // データが存在する場合は課題番号を表示
    if (data.entries && data.entries.length > 0) {
      console.log("検索結果:");
      data.entries.forEach(entry => {
        console.log(`研究者名: ${entry.name}`);
        console.log(`課題番号: ${entry.researcher_id}`);
        console.log('---');
      });
    } else {
      console.log("該当する研究者が見つかりませんでした。");
    }
  } catch (error) {
    console.error("エラーが発生しました:", error.message);
  }
}

// 関数を呼び出し
fetchResearcherId();

curl "https://kaken.nii.ac.jp/opensearch/?qh=龍谷大学&qg=藤原和将"
curl "https://kaken.nii.ac.jp/opensearch/?qh=龍谷大学&qg=藤原和将"
