document.addEventListener("DOMContentLoaded", function () {
	const pdfImportButton = document.getElementById("pdf-import");

	pdfImportButton.addEventListener("click", async () => {
		const pdfInput = document.getElementById("pdfUpload");
		const pdfFile = pdfInput.files[0];
		if (!pdfFile) {
			alert("PDFファイルを選択してください");
			return;
		}

		try {
			const jsonData = await fetchJsonFromPdf(pdfFile);
			fillFormWithData(jsonData);
			alert("PDF情報をフォームに反映しました。");
		} catch (error) {
			console.error("PDF情報の転記中にエラーが発生しました: ", error);
			alert("PDF情報の転記中にエラーが発生しました。詳細はコンソールを確認してください。");
		}
	});
});

async function fetchJsonFromPdf(pdfFile) {
	const formData = new FormData();
	formData.append('file', pdfFile);
	const GEMINI_API_KEY = process.env.GEMINI;

	try {
		const response = await fetch('https://api.gemini.com/v1/parse/pdf', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GEMINI_API_KEY}`
			},
			body: formData
		});

		if (!response.ok) throw new Error('Failed to fetch JSON from PDF');

		const data = await response.json();
		return processData(data);
	} catch (error) {
		console.error('Error fetching or processing PDF:', error);
		throw error;
	}
}

function fillFormWithData(data) {
	document.getElementById("支払先").value = data.issuer;
	document.getElementById("支払者").value = data.receiver_name; // 支払者と受領者名を一致させる場合
	data.items.forEach((item, index) => {
		const idx = index + 1;
		document.getElementById(`項目${idx.toString().padStart(2, '0')}`).textContent = item.product_name;
		document.getElementById(`メーカー${idx.toString().padStart(2, '0')}`).textContent = item.provider;
		document.getElementById(`型番${idx.toString().padStart(2, '0')}`).textContent = item.model;
		document.getElementById(`個数${idx.toString().padStart(2, '0')}`).textContent = item.number;
		document.getElementById(`単価${idx.toString().padStart(2, '0')}`).textContent = item.unite_price.replace(/,/g, '');
		document.getElementById(`金額${idx.toString().padStart(2, '0')}`).textContent = item.total_price.replace(/,/g, '');
		// 費目を自動選択する場合
		document.getElementById(`費目${idx.toString().padStart(2, '0')}`).value = item.total_price >= 10000 ? '備品' : '消耗品';
	});
}

function processData(data) {
	return {
		title: data.title,
		issuer: data.issuer,
		receiver_name: data.receiver_name,
		items: data.items.filter(item => parseFloat(item.total_price.replace(/,/g, '')) !== 0).map(item => ({
			product_name: item.product_name,
			provider: item.provider,
			model: item.model,
			number: item.number,
			unite_price: item.unite_price.replace(/,/g, ''),
			total_price: item.total_price.replace(/,/g, '')
		}))
	};
}

