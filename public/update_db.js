document.getElementById('db-updated').addEventListener('click', async function() {
	// フォームデータの収集
	const requestData = {
		pnumber: document.getElementById('研究課題番号').value,
		ptype: document.getElementById('課題種別').value,
		pname: document.getElementById('課題名').value,
		PIname: document.getElementById('代表者').value,
		CIname: document.getElementById('分担者').value,
		delivered_campus: document.getElementById('納品キャンパス').value,
		delivered_location: document.getElementById('納品先').value,
		installed_campus: document.getElementById('設置キャンパス').value,
		installed_location: document.getElementById('設置先').value
	};

	// 研究者番号を検索する関数
	async function fetchResearcherNumber(name) {
		if (!name) return 'NONE'; // 名前が空の場合はNONEを返す

		try {
			const response = await fetch(`/researchers:get:rnumber?rname=${name}`);
			// output 例: {"rnumber":40868262}

			if (!response.ok) {
				console.log('local dbに研究者が見つかりませんでした');
				const response2 = await fetch(`/searchResearcherNumber?name=${name}`);
				// output 例: {"totalResults":1,"researcherIds":[["40868262"]]}
				if (!response2.ok) {
					console.log('外部dbに研究者が見つかりませんでした');
					return 'NONE';
				}
			}

			const result = await response.json();
			// result.rnumber が存在しない場合は外部dbに照会
			if (!rnumber) {
				const result2 = await response2.json();
				if(result2.totalResults === 0) {
					console.log('外部dbに研究者が見つかりませんでした');
					return "NONE";
				} else if(result2.totalResults > 1) {
					console.log('外部dbに複数の研究者が見つかりました');
					return "NONE";
				}
				const rnumber2 = result2.researcherIds[0][0];
				return rnumber2;
			}

			const rnumber = result.rnumber;
			return rnumber;
		} catch (error) {
			console.error('研究者番号の取得に失敗:', error);
			return 'NONE';
		}
	}

	// 代表者と分担者の研究者番号を検索し、requestDataを更新
	requestData.PIname = await fetchResearcherNumber(requestData.PIname);
	requestData.CIname = await fetchResearcherNumber(requestData.CIname);

	// データベースに送信
});
