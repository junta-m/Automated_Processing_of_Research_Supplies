# 研究費管理システム インストール手順

## 前提条件

以下のソフトウェアが必要です：

- Node.js (v16以上)
- npm (Node.jsに付属)
- Google Chrome (最新版推奨)

### OS別のChromeインストール手順

#### Windows
1. [Google Chrome公式サイト](https://www.google.com/chrome/)からインストーラーをダウンロード
2. ダウンロードしたインストーラーを実行
3. インストールウィザードの指示に従って進める

#### macOS
1. [Google Chrome公式サイト](https://www.google.com/chrome/)からインストーラー(.dmg)をダウンロード
2. ダウンロードしたDMGファイルを開く
3. Chromeアイコンをアプリケーションフォルダにドラッグ＆ドロップ

#### Linux (Ubuntu/Debian)
```bash
# 依存関係のインストール
sudo apt-get update
sudo apt-get install -y wget

# Chromeリポジトリの追加
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# Chromeのインストール
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

### OS別のNode.jsインストール手順

#### Windows
1. Node.jsのインストール
   - [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロード
   - ダウンロードしたインストーラー(.msi)を実行
   - インストールウィザードの指示に従って進める
2. インストールの確認
   ```bash
   node --version
   npm --version
   ```

#### macOS
1. Homebrewを使用する場合
   ```bash
   # Homebrewのインストール（未インストールの場合）
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Node.jsのインストール
   brew install node
   ```

2. 公式インストーラーを使用する場合
   - [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロード
   - ダウンロードしたパッケージ(.pkg)を実行
   - インストーラーの指示に従って進める

#### Linux (Ubuntu/Debian)
```bash
# パッケージマネージャーの更新
sudo apt update
sudo apt upgrade

# Node.jsとnpmのインストール
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# インストールの確認
node --version
npm --version
```

## インストール手順

1. リポジトリのクローンとブランチの切り替え
```bash
git clone https://github.com/KazumasaFUJIWARA/Automated_Processing_of_Research_Supplies.git
cd Automated_Processing_of_Research_Supplies
git checkout develop-matsukidaira
```

2. 依存パッケージのインストール
```bash
npm install
```

3. 環境設定
- 必要に応じて環境変数を設定してください
- データベースは自動的に作成されます

## OS別の追加設定

### Windows
- Puppeteerが必要とする追加のDLLがない場合は、Visual C++ 再頒布可能パッケージをインストール：
  - [Microsoft Visual C++ Redistributable](https://learn.microsoft.com/ja-JP/cpp/windows/latest-supported-vc-redist)からダウンロードしてインストール

### macOS
- 追加の設定は通常不要です
- M1/M2 Macの場合、Rosettaのインストールが必要な場合があります：
  ```bash
  softwareupdate --install-rosetta
  ```

### Linux
- Puppeteerの依存パッケージをインストール：
```bash
sudo apt-get update
sudo apt-get install -y libgbm-dev
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

## 起動方法

### 開発モード
```bash
npm run dev
```

### 本番モード
```bash
npm start
```

### デバッグモード
```bash
npm run debug
```

## アクセス方法

アプリケーションが起動したら、ブラウザで以下のURLにアクセスしてください：
```
http://localhost:3000
```

## トラブルシューティング

### 共通の問題
1. パッケージのインストールでエラーが発生する場合
```bash
npm cache clean --force
npm install
```

### Windows固有の問題
1. `node-gyp`関連のエラーが発生する場合
```bash
npm install --global windows-build-tools
```

2. Puppeteerの起動に失敗する場合
- Windowsファイアウォールの設定を確認
- アンチウイルスソフトの設定を確認

### macOS固有の問題
1. M1/M2 Macでの互換性の問題
```bash
# Rosettaを使用してインストール
arch -x86_64 npm install
```

### Linux固有の問題
1. 権限の問題が発生する場合
```bash
# npmのグローバルディレクトリの権限を修正
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

## サポート

問題が発生した場合は、Issueを作成してください。 