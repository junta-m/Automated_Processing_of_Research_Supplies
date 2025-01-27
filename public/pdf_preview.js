document.addEventListener("DOMContentLoaded", function () {
    const pdfUpload = document.getElementById("pdfUpload");
    const pdfPreview = document.getElementById("pdfPreview");

    // PDF.js ワーカーのパスを設定
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js';

    pdfUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileReader = new FileReader();

            fileReader.onload = function (e) {
                const pdfData = new Uint8Array(e.target.result);

                // PDF.js を使用してPDFを表示
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                loadingTask.promise.then(function (pdf) {
                    pdf.getPage(1).then(function (page) {
                        const previewWidth = pdfPreview.clientWidth; // プレビュー領域の幅
                        const previewHeight = pdfPreview.clientHeight; // プレビュー領域の高さ

                        const viewport = page.getViewport({ scale: 1 });
                        let scale = Math.min(
                            previewWidth / viewport.width,
                            previewHeight / viewport.height
                        );

                        const scaledViewport = page.getViewport({ scale: scale });

                        const canvas = document.createElement("canvas");
                        const context = canvas.getContext("2d");
                        canvas.width = scaledViewport.width;
                        canvas.height = scaledViewport.height;

                        pdfPreview.innerHTML = ""; // プレビュー領域をクリア
                        pdfPreview.appendChild(canvas);

                        const renderContext = {
                            canvasContext: context,
                            viewport: scaledViewport,
                        };
                        page.render(renderContext);
                    });
                });
            };

            fileReader.readAsArrayBuffer(file);
        } else {
            alert("PDFファイルを選択してください");
        }
    });
});

