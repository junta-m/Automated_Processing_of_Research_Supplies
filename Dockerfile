# Node.jsイメージを使用
FROM node:18

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# 依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションファイルをコピー
COPY . .

# サーバーポート設定
EXPOSE 3000

# アプリケーションを起動
CMD ["node", "server/server.js"]

