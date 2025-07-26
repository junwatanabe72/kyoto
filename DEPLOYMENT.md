# GitHub Pages デプロイメントガイド

このプロジェクトをGitHub Pagesにデプロイするためのガイドです。

## 前提条件

1. Google Maps API Keyが必要です
2. GitHubリポジトリにプッシュ権限が必要です

## セットアップ手順

### 1. Google Maps API Key の設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Maps JavaScript API を有効化
3. API キーを作成し、必要に応じてドメイン制限を設定
4. GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：
   - `REACT_APP_GOOGLE_MAPS_API_KEY`: Google Maps API キー

### 2. GitHub Pages の有効化

1. GitHubリポジトリの Settings > Pages に移動
2. Source を "GitHub Actions" に設定
3. 自動的にワークフローが実行されます

### 3. デプロイ

```bash
# リポジトリをプッシュするとワークフローが自動実行されます
git push origin main
```

## ローカル開発

```bash
# 依存関係のインストール
npm install --legacy-peer-deps

# 環境変数ファイルの作成
cp .env.example .env
# .envファイルを編集してGoogle Maps API Keyを設定

# 開発サーバーの起動
npm start
```

## 手動デプロイ

```bash
# ビルドとデプロイ
npm run build
npm run deploy
```

## トラブルシューティング

### API キーエラー
- GitHub Secretsに`REACT_APP_GOOGLE_MAPS_API_KEY`が正しく設定されているか確認
- Google Cloud ConsoleでMaps JavaScript APIが有効化されているか確認

### ページが表示されない
- package.jsonの`homepage`URLが正しいか確認
- GitHub PagesのSourceが"GitHub Actions"に設定されているか確認

### ビルドエラー
- 依存関係の競合がある場合は`--legacy-peer-deps`フラグを使用