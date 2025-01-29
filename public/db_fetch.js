document.getElementById("asign-info-from-db").addEventListener("click", async function () {
    let projectNumber = document.getElementById("研究課題番号").value;
    if (!projectNumber) {
        alert("課題番号を入力してください");
        return;
    }

    try {
        let response = await fetch(`/fetchProjectInfo?projectNumber=${projectNumber}`);
        let data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        // `AT` を `課題種別` にセット
        if (data.課題種別) {
            document.getElementById("課題種別").value = data.課題種別;
        } else {
            document.getElementById("課題種別").value = "DB未登録";
        }

        // `AName` を `課題名` にセット
        if (data.課題名) {
            document.getElementById("課題名").value = data.課題名;
        } else {
            document.getElementById("課題名").value = "DB未登録";
        }

        // `納品キャンパス`, `納品先`, `設置キャンパス`, `設置先` をセット
        document.getElementById("納品キャンパス").value = data.納品キャンパス || "";
        document.getElementById("納品先").value = data.納品先 || "";
        document.getElementById("設置キャンパス").value = data.設置キャンパス || "";
        document.getElementById("設置先").value = data.設置先 || "";

        // `PI`（代表者）がある場合は取得してセット
        if (data.PI) {
            let piResponse = await fetch(`/fetchResearcherName?researcherId=${data.PI}`);
            let piData = await piResponse.json();
            document.getElementById("代表者").value = piData.name || "DB未登録";
        } else {
            document.getElementById("代表者").value = "DB未登録";
        }

        // `CI`（分担者）がある場合のみ取得してセット
        if (data.CI) {
            let ciResponse = await fetch(`/fetchResearcherName?researcherId=${data.CI}`);
            let ciData = await ciResponse.json();
            document.getElementById("分担者").value = ciData.name || "DB未登録";
        }

    } catch (error) {
        console.error("エラー:", error);
        alert("データ取得に失敗しました");
    }
});

