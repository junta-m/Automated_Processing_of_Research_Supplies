document.addEventListener("DOMContentLoaded", function () {
    const pdfUpload = document.getElementById("pdfUpload");
    const pdfPreview = document.getElementById("pdfPreview");
    const zoomIn = document.getElementById("zoomIn");
    const zoomOut = document.getElementById("zoomOut");

    let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.0; // 初期スケール

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js';

    function renderPage(pageNumber, scale) {
        pdfDoc.getPage(pageNumber).then(function (page) {
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            pdfPreview.innerHTML = ""; // プレビュー領域をクリア
            pdfPreview.appendChild(canvas);

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            page.render(renderContext);
        });
    }

    pdfUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileReader = new FileReader();

            fileReader.onload = function (e) {
                const pdfData = new Uint8Array(e.target.result);

                pdfjsLib.getDocument({ data: pdfData }).promise.then(function (pdf) {
                    pdfDoc = pdf;
                    renderPage(currentPage, scale); // 初期ページを描画
                });
            };

            fileReader.readAsArrayBuffer(file);
        } else {
            alert("PDFファイルを選択してください");
        }
    });

    zoomIn.addEventListener("click", function () {
        if (pdfDoc) {
            scale += 0.1; // 拡大
            renderPage(currentPage, scale);
        }
    });

    zoomOut.addEventListener("click", function () {
        if (pdfDoc) {
            scale = Math.max(scale - 0.1, 0.1); // 縮小（0.1以下にはしない）
            renderPage(currentPage, scale);
        }
    });
});

