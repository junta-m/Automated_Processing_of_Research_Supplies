document.addEventListener("DOMContentLoaded", function() {
    const fetchButton = document.getElementById("local-an-fetch");
    fetchButton.addEventListener("click", function() {
        const researcherNumber = document.getElementById("研究者番号").value.trim();
        if (!researcherNumber) {
            alert("研究者番号を入力してください。");
            return;
        }

        fetch(`/getProjectsByResearcherNumber?researcherNumber=${encodeURIComponent(researcherNumber)}`)
            .then(response => response.json())
            .then(data => {
                const projectOptions = document.getElementById("project-options");
                projectOptions.innerHTML = "";  // Clear existing options

                if (data.projects && data.projects.length > 0) {
                    data.projects.forEach(project => {
                        let option = document.createElement("option");
                        option.value = project;
							  option.textContent = project;
                        projectOptions.appendChild(option);
                    });
                    console.log(`${data.projects.length} projects added to the datalist.`);
                } else {
                    console.log("No projects found.");
                }
            })
            .catch(error => {
                console.error("Error fetching data: ", error);
            });
    });
});

