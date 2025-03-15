import pandas as pd
import json
import re

# Excelファイルのパスとシート名
file_path = './cho_202501.xlsx'
sheet_name = '印刷FORM'

# ヘッダー無しで全体を読み込む（特殊なレイアウト対応）
df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)

# E列（インデックス4）および N列（インデックス13）が存在する行のみ抽出
# df = df.dropna(subset=[4, 13])
df = df.iloc[1:]
df = df[(df[4].notna()) | (df[13].notna())]
result = []

for idx, row in df.iterrows():
    # E列の値をキーとし、空白文字（スペース、改行など）を除去
    key_e = str(row[4])
    key_e_clean = re.sub(r'\s+', '', key_e)
    
    # F～I列の値をオブジェクトとして取得
    values_e = {
        "F": row[5],
        "G": row[6],
        "H": row[7],
        "I": row[8]
    }
    
    # N列の値をキーとし、空白文字を除去
    key_n = str(row[13])
    key_n_clean = re.sub(r'\s+', '', key_n)
    
    # O～R列（インデックス14～17）の値をオブジェクトとして取得
    values_n = {
        "O": row[14],
        "P": row[15],
        "Q": row[16],
        "R": row[17]
    }
    
    result.append({key_e_clean: values_e})
    result.append({key_n_clean: values_n})

nan_result = [entry for entry in result if 'nan' not in entry]
filtered_result = [entry for entry in nan_result if '京都市住民基本台帳の町別人口' not in entry]

# JSON形式でファイル出力（output.json）
with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(filtered_result, f, ensure_ascii=False, indent=2)

print("JSONファイル 'output.json' を作成しました。")