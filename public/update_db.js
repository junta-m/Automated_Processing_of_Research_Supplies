document.addEventListener("DOMContentLoaded", function() {
	const fetchButton = document.getElementById("dbs-update");
	fetchButton.addEventListener("click", function() {
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

		// データの確認 {ud: requestData}
		console.log(requestData);

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
		const PI = fetchResearcherNumber(requestData.PIname);
		const CI = fetchResearcherNumber(requestData.CIname);

		// データベースに送信
		//app.post('/updateProject', (req, res) => {
		//const { projectNumber, projectType, projectTitle } = req.body;
		// request.Dataから{pnumber,ptype,pname}を取り出して
		//データベースに登録する処理を書く
		const projectsRecord = {
			pnumber: requestData.pnumber,
			ptype: requestData.ptype,
			pname: requestData.pname,
		};

		response = fetch('/updateProject', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(projectsRecord)
		});

		if(response.ok) {
			console.log('プロジェクト情報の更新に成功');
		}else {
			console.log('プロジェクト情報の更新に失敗');
		}

		//app.post('/updateAllocation', (req, res) => {
		//const { projectNumber, PI, CI, distributedCampus, distributedLocation, installedCampus, installedLocation } = req.body;

		const allocationsRecord = {
			pnumber: requestData.pnumber,
			PI: PI,
			CI: CI,
			delivered_campus: requestData.delivered_campus,
			delivered_location: requestData.delivered_location,
			installed_campus: requestData.installed_campus,
			installed_location: requestData.installed_location
		};

		response2 = fetch('/updateAllocation', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(allocationsRecord)
		});

		if(response2.ok) {
			console.log('割り当て情報の更新に成功');
		}else {
			console.log('割り当て情報の更新に失敗');
		}
	});
});
