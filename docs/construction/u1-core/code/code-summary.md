# iMakore U1-core — コード生成サマリー

## 生成ファイル一覧

### アプリケーションコード（ワークスペースルート）

| ファイル | 役割 |
|---|---|
| `index.html` | メインページ（全 DOM 構造・data-testid 付き）|
| `css/style.css` | 全スタイル（CSS カスタムプロパティ・レスポンシブ）|
| `js/utils.js` | formatTime / formatTimeCompact / formatDate / getToday / generateId |
| `js/storage.js` | StorageGateway（localStorage 全操作・QuotaExceededError 処理）|
| `js/timer.js` | PrecisionTimer（Date.now() 基準・resume 対応）|
| `js/projects.js` | ProjectManager（CRUD・BR-01 バリデーション含む）|
| `js/accumulator.js` | DailyAccumulator（累積・checkAndRollover・purgeOldData）|
| `js/calendar.js` | CalendarView（月カレンダー・日別詳細・削除済みプロジェクト対応）|
| `js/menu.js` | MenuController（メニュー・AddDialog・DeleteDialog・Toast）|
| `js/main.js` | AppController（エントリポイント・セッション管理・Page Visibility API）|

### テスト

| ファイル | 対象 |
|---|---|
| `tests/utils.test.js` | formatTime / formatTimeCompact / formatDate / getToday の境界値テスト |
| `tests/storage.test.js` | localStorage シリアライズラウンドトリップ・null ケース |
| `tests/accumulator.test.js` | ロールオーバー検知・深夜計算・日付文字列比較 |

### 設定・デプロイ

| ファイル | 内容 |
|---|---|
| `package.json` | vitest devDependency のみ（アプリ自体は依存ゼロ）|
| `vitest.config.js` | jsdom 環境・globals: true |
| `.github/workflows/deploy.yml` | GitHub Actions による GitHub Pages 自動デプロイ |
| `README.md` | 使い方・動作環境・デプロイ手順 |

## 実装された要件とビジネスルール

| BR / UC | 実装場所 |
|---|---|
| BR-01 バリデーション | `menu.js:handleAddSubmit` |
| BR-02/03 セッション遷移・初期プロジェクト | `main.js:beginWork` |
| BR-04 日次ロールオーバー（次操作時）| `accumulator.js:checkAndRollover` |
| BR-05 セッション復元 | `main.js:init` |
| BR-06 タイマー精度（Date.now()）| `timer.js:getElapsedSeconds` |
| BR-07 削除プロジェクト履歴保持 | `storage.js:addDeletedProject`, `calendar.js:showDayDetail` |
| BR-08 ボタン状態ルール | `main.js:updateSessionBar`, `updateBeginBtnState` |
| BR-09 時間フォーマット | `utils.js:formatTime`, `formatTimeCompact` |
| PATTERN-01 Page Visibility API | `main.js:init` (visibilitychange) |
| PATTERN-02 StorageGateway | `storage.js:write` (try-catch) |
| PATTERN-03 2 年パージ | `accumulator.js:purgeOldData` |
| PATTERN-04 XSS 防止（textContent）| 全 DOM 生成箇所 |
| PATTERN-05 セッション永続化 | `main.js:beginWork`, `switchProject`, `endWork` |
| UC-01〜08 全ユースケース | `main.js` + 各モジュール |
