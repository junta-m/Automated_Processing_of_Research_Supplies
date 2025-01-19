import json
import csv
import win32com.client
import os

# ベースディレクトリを取得
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# ファイルパス
json_file_path = os.path.join(script_dir, "test.json")
csv_file_path = os.path.join(script_dir, "Fujiwara_Kansetsu.csv")
excel_file_path = os.path.join(script_dir, "Kaken.xlsx")
output_excel_path = os.path.join(script_dir, "output.xlsx")

# JSONファイルを読み込む
with open(json_file_path, encoding="utf-8") as file:
    data = json.load(file)

# 品名と値段をリストに抽出（価格が0のものを除外）
items = data.get("items", [])
filtered_items = [(item["product_name"], int(item["price"])) for item in items if int(item["price"]) > 0]

# CSVファイルからデータを読み込む
csv_data = {}
with open(csv_file_path, encoding="utf-8") as csv_file:
    reader = csv.reader(csv_file, delimiter="\t")
    for row in reader:
        if len(row) == 2:  # キーと値が存在する行のみ処理
            csv_data[row[0]] = row[1]

# Excelアプリケーションを起動
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

# ファイルを開く
workbook = excel.Workbooks.Open(excel_file_path)

# シートを選択
sheet = workbook.Sheets("様式1　研究費支出願 (出張、支払手数料以外)")

# JSONデータをExcelに入力（G28以降、V28以降）
start_row = 28  # G28, V28から始める
for i, (product_name, price) in enumerate(filtered_items):
    sheet.Cells(start_row + i, 7).Value = product_name  # G列 (7列目)
    sheet.Cells(start_row + i, 22).Value = price  # V列 (22列目)

# CSVデータをExcelに入力
if "所属・職名" in csv_data:
    sheet.Cells(8, 17).Value = csv_data["所属・職名"]  # Q8

if "職員番号" in csv_data:
    sheet.Cells(9, 17).Value = csv_data["職員番号"]  # Q9

if "申請者" in csv_data:
    sheet.Cells(10, 17).Value = csv_data["申請者"]  # Q10

if "研究代表者" in csv_data:
    sheet.Cells(11, 17).Value = csv_data["研究代表者"]  # Q11

if "研究費" in csv_data:
    sheet.Cells(20, 9).Value = csv_data["研究費"]  # I20

if "課題番号" in csv_data:
    sheet.Cells(20, 23).Value = csv_data["課題番号"]  # W20

# 上書き保存
try:
    workbook.SaveAs(output_excel_path)
    print(f"データを次のパスに保存しました: {output_excel_path}")
except Exception as e:
    print(f"保存中にエラーが発生しました: {e}")
finally:
    workbook.Close()
    excel.Quit()
