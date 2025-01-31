document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("local-an-fetch").addEventListener("click", function() {
        const researcherNumber = document.getElementById("研究者番号").value.trim();
        if (!researcherNumber) {
            alert("研究者番号を入力してください。");
            return;
        }

        // 研究者氏名を取得
        fetch(`/fetchResearcherName?researcherId=${encodeURIComponent(researcherNumber)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.warn("研究者氏名の取得に失敗:", data.error);
                    return;
                }
                document.getElementById("研究者氏名").value = data.name; // 研究者氏名を更新
            })
            .catch(error => {
                console.error("研究者氏名取得エラー:", error);
            });

        // 課題番号の取得
        fetch(`/getProjectsByResearcherNumber?researcherNumber=${encodeURIComponent(researcherNumber)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                const projectOptions = document.getElementById("projectOptions");
                projectOptions.innerHTML = ""; // 既存の候補をクリア

                data.projects.forEach(projectNumber => {
                    const option = document.createElement("option");
                    option.value = projectNumber;
                    projectOptions.appendChild(option);
                });

                // `datalist` の変更を認識させる
                document.getElementById("研究課題番号").setAttribute("list", "projectOptions");

                alert("課題番号候補を更新しました。");
            })
            .catch(error => {
                console.error("データ取得エラー:", error);
                alert("データ取得に失敗しました。");
            });
    });
});

