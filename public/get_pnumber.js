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

					// 検索結果が0件の場合、警告を表示
					// 検索結果が1件の場合、課題番号を自動入力
					// 複数件の場合はdatalistを表示
					if (data.projects.length === 0) {
						alert("該当する課題番号が見つかりませんでした。");
					} else if (data.projects.length === 1) {
						document.getElementById("研究課題番号").value = data.projects[0];
					} else {
						document.getElementById("研究課題番号").setAttribute("list", "projectOptions");
						alert("課題番号候補を追加したので,選択してください. 候補にない場合は情報を入力してください.");
					}

            })
            .catch(error => {
                console.error("データ取得エラー:", error);
                alert("データ取得に失敗しました。");
            });
    });
});

