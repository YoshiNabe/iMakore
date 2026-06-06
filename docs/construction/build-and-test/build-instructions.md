# iMakore — ビルド手順

## 概要

iMakore はバニラ HTML/CSS/JS のみで構成される静的 Web アプリです。**アプリ本体にビルドステップは不要**です。`index.html` をそのまま配信できます。

---

## アプリ本体のビルド

### 前提条件

| 要件 | 内容 |
|---|---|
| ビルドツール | なし（バニラ JS、ビルド不要）|
| 配信方法 | 静的ファイルをそのままホスティング |
| 依存パッケージ | なし（`node_modules` 不要）|

### GitHub Pages への配信

1. リポジトリを GitHub に push する:

```bash
git init
git add .
git commit -m "Initial commit: iMakore v1.0.0"
git remote add origin https://github.com/<username>/iMakore.git
git push -u origin main
```

2. GitHub リポジトリの **Settings → Pages → Source** を `GitHub Actions` に設定する
3. `main` ブランチへの push で `.github/workflows/deploy.yml` が自動実行される
4. デプロイ完了後、以下の URL でアクセス可能になる:

```
https://<username>.github.io/iMakore/
```

### ローカルでの確認

ビルドは不要だが、ES Modules の制約上 `file://` プロトコルでは動作しない場合がある。ローカルサーバーで確認する:

```bash
# Node.js がある場合
npx serve .

# Python がある場合
python3 -m http.server 8080
```

`http://localhost:8080` でアプリを確認する。

---

## テスト用依存パッケージのインストール（任意）

ユニットテストを実行する場合のみ Node.js 環境が必要:

```bash
cd C:\Users\y_watanabe\imakore
npm install
```

**インストール内容（devDependency のみ）:**

| パッケージ | バージョン | 用途 |
|---|---|---|
| vitest | ^1.6.0 | テストランナー |
| @vitest/coverage-v8 | ^1.6.0 | カバレッジ計測（任意）|
| jsdom | ^24.1.0 | DOM 環境シミュレーション |

---

## ビルド成果物

| 成果物 | 場所 | 説明 |
|---|---|---|
| `index.html` | ルート | メインページ（配信ファイル）|
| `css/style.css` | `css/` | スタイルシート |
| `js/*.js` | `js/` | 各 JS モジュール（8 ファイル）|
| GitHub Pages | `https://<username>.github.io/iMakore/` | 公開 URL |
