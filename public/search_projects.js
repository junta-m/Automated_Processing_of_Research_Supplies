document.addEventListener("DOMContentLoaded", function () {
    const kakenButton = document.getElementById("KAKEN");
    if (kakenButton) {
        kakenButton.addEventListener("click", async function () {
            await handleKakenSearch();
        });
    } else {
        console.error("エラー: KAKENボタンが見つかりません。");
    }
});

async function handleKakenSearch() {
    const researcherNumber = document.getElementById("研究者番号").value.trim();
    if (!researcherNumber) {
        alert("研究者番号を入力してください。");
        return;
    }

    try {
        const response = await fetch("/searchProject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ researcherNumber })
        });

        if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data || !data.projectNumbers) {
            throw new Error("課題番号の取得に失敗しました");
        }

        console.log("取得した課題番号:", data.projectNumbers);

        const projectOptions = document.getElementById("projectOptions");
        projectOptions.innerHTML = "";
        data.projectNumbers.forEach(pnum => {
            const option = document.createElement("option");
            option.value = pnum;
            projectOptions.appendChild(option);
        });

        await searchProjectFromDB();
    } catch (error) {
        console.error("エラー:", error);
        alert(`課題番号の検索中にエラーが発生しました: ${error.message}`);
    }
}

