function fetchJsonData() {
    fetch("/test.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("JSONファイルの読み込みに失敗しました。");
            }
            return response.json();
        })
        .then(data => {
            const extracted = data.extracted_json;

            // Titleによる条件分岐
            if (extracted.title === "領収書") {
                document.getElementById("payment").value = "立替";
                document.getElementById("支払者").value = extracted.receiver_name;
            } else if (extracted.title === "納品書") {
                document.getElementById("payment").value = "業者払い";
            }

            // 共通項目設定
            document.getElementById("支払先").value = extracted.issuer;
            document.getElementById("研究者氏名").value = extracted.receiver_name;

            // 研究者番号の検索と入力
            fetchResearcherNumber(extracted.receiver_name);

            // 項目情報の転記
            const items = extracted.items;
            items.forEach((item, index) => {
                const rowNumber = String(index + 1).padStart(2, "0"); // 例: "01", "02"
                document.getElementById(`項目${rowNumber}`).textContent = item.product_name || "";
                document.getElementById(`メーカー${rowNumber}`).textContent = item.provider || "";
                document.getElementById(`型番${rowNumber}`).textContent = item.model || "";
                document.getElementById(`個数${rowNumber}`).textContent = item.number || "";
                document.getElementById(`単価${rowNumber}`).textContent = item.unite_price || "";
                document.getElementById(`金額${rowNumber}`).textContent = item.total_price || "";

                // 単価に基づいて費目を選択
                const unitPrice = parseFloat(item.unite_price) || 0; // 数値に変換
                const expenseTypeField = document.getElementById(`費目${rowNumber}`);
                if (unitPrice < 10000) {
                    expenseTypeField.value = "消耗品";
                } else if (unitPrice >= 200000) {
                    expenseTypeField.value = "備品";
                } else {
                    expenseTypeField.value = "用品";
                }
            });

            alert("PDF情報を転記しました。");
        })
        .catch(error => {
            console.error(error);
            alert("エラーが発生しました。");
        });
}

// 研究者番号を取得して入力する関数
async function fetchResearcherNumber(name) {
    try {
        const response = await fetch(`/getResearcherNumber?name=${encodeURIComponent(name)}`);
        if (!response.ok) {
            throw new Error("研究者番号の取得に失敗しました。");
        }
        const data = await response.json();

        if (data.researcherNumber) {
            document.getElementById("研究者番号").value = data.researcherNumber;
        } else {
            alert("該当する研究者番号が見つかりませんでした。");
        }
    } catch (error) {
        console.error("エラー:", error);
        alert("研究者番号の検索中にエラーが発生しました。");
    }
}

// PDF情報転記ボタンにイベントリスナーを追加
document.getElementById("pdf-import").addEventListener("click", fetchJsonData);

