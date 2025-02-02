document.getElementById("asign-info-from-db").addEventListener("click", async function () {
	let projectNumber = document.getElementById("研究課題番号").value;
	if (!projectNumber) {
		alert("課題番号を入力してください");
		return;
	}

	try {
		// 課題情報取得
		let projectResponse = await fetch(`/getProject?projectNumber=${encodeURIComponent(projectNumber)}`);
		let projectData = await projectResponse.json();

		if (!projectResponse.ok) {
			console.error("課題情報エラー:", projectData.error);
			alert(`課題情報の検索中にエラーが発生しました: ${projectData.error}`);
			return;
		}

		console.log("取得した課題情報:", projectData);
		document.getElementById("課題種別").value = projectData.課題種別 || "DB未登録";
		document.getElementById("課題名").value = projectData.課題名 || "DB未登録";

		// 課題配分情報取得
		let allocationResponse = await fetch(`/getAllocation?projectNumber=${encodeURIComponent(projectNumber)}`);
		let allocationData = await allocationResponse.json();

		if (!allocationResponse.ok) {
			console.error("配分情報エラー:", allocationData.error);
			alert(`課題配分情報の検索中にエラーが発生しました: ${allocationData.error}`);
			return;
		}

		console.log("取得した配分情報:", allocationData);
		document.getElementById("納品キャンパス").value = allocationData.納品キャンパス || "DB未登録";
		document.getElementById("納品先").value = allocationData.納品先 || "DB未登録";
		document.getElementById("設置キャンパス").value = allocationData.設置キャンパス || "DB未登録";
		document.getElementById("設置先").value = allocationData.設置先 || "DB未登録";

		// 代表者 (PI) の情報取得
		if (allocationData.PI) {
			let piResponse = await fetch(`/getResearcherName?researcherNumber=${encodeURIComponent(allocationData.PI)}`);
			let piData = await piResponse.json();
			document.getElementById("代表者").value = piData.研究者 || "DB未登録";
		} else {
			document.getElementById("代表者").value = "DB未登録";
		}

		// 分担者 (CI)の情報取得
		if (allocationData.CI) {
			//CIがNONEの場合は空欄
			if (allocationData.CI === "NONE") {
				document.getElementById("分担者").value = "";
			}else{
				let ciResponse = await fetch(`/getResearcherName?researcherNumber=${encodeURIComponent(allocationData.CI)}`);
				let ciData = await ciResponse.json();
				document.getElementById("分担者").value = ciData.研究者 || "未登録研究者番号";
			}
		} else {
			document.getElementById("分担者").value = "Null"; //Nullの場合は空欄
		}

	} catch (error) {
		console.error("リクエストエラー:", error);
		alert("課題情報の検索中にエラーが発生しました。サーバーを確認してください。");
	}
});

