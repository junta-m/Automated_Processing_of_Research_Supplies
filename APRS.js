const fs = require('fs');

// JSONファイルのパス
const filePath = './test.json';

const taxRate = 0.1;

// JSONファイルを読み込む
fs.readFile(filePath, 'utf8', (err, data) => {
	if (err) {
		console.error('ファイル読み込みエラー:', err.message);
		return;
	}

	let receiver = '';
	let jsonData = null;

	try {
		// JSONデータをパース
		jsonData = JSON.parse(data);

		// 領収書名を取得して表示
		receiver = jsonData.receiver;
	} catch (parseErr) {
		console.error('JSONパースエラー:', parseErr.message);
	}

	// userから大学名や敬称, 空白を削除
	// 例: 龍谷大学 藤原 和将 様 -> 藤原和将
	const user = receiver.replace(/龍谷大学|様|　| /g, '');

	// itemsを取得
	const items = jsonData.items;

	// itemsのpriceが0のものを削除
	const filteredItems = items.filter((item) => item.price > 0);

	// filteredItemsのproduct_nameを表示
	filteredItems.forEach((item) => {
		console.log(item.product_name);
	});

	// 項目ごとの金額を合計
	const summedPrice = jsonData.items.reduce((sum, item) => {
		// priceを数値に変換して加算
		return sum + (parseInt(item.price, 10) || 0);
	}, 0);

	// jsonのtotal_amountとsummedPriceが一致するか確認
	if (parseInt(jsonData.total_amount, 10) === summedPrice) {
		console.log('金額合計が一致しています');
	} else {
		// 一致しない場合は単価を読んでいるか, 外税を計算している.

		// :w
	}

});
