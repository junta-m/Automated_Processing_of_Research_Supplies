document.addEventListener("DOMContentLoaded", () => {
    const pdfImportButton = document.getElementById("pdf-import");
    if (pdfImportButton) {
        pdfImportButton.addEventListener("click", () => {
            fetchJsonData();
        });
    } else {
        console.error("ボタン要素が見つかりません: pdf-import");
    }
});

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

            alert("PDF情報を転記しました。");
        })
        .catch(error => {
            console.error(error);
            alert("エラーが発生しました。");
        });
}

