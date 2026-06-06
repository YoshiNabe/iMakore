# iMakore U1-core — Code Generation Plan

## ユニット情報

- **ユニット**: U1-core（iMakore Web アプリ全体）
- **プロジェクトタイプ**: Greenfield / 単一ユニット
- **コード配置**: `c:\Users\y_watanabe\imakore\` (ワークスペースルート)
- **GitHub Pages 配信**: `index.html` をリポジトリルートに配置

## ファイル構成（生成対象）

```
iMakore/
├── index.html              # メイン HTML
├── css/
│   └── style.css           # 全スタイル（レスポンシブ）
├── js/
│   ├── utils.js            # 共通ユーティリティ（純粋関数）
│   ├── storage.js          # StorageGateway
│   ├── timer.js            # PrecisionTimer
│   ├── projects.js         # ProjectManager
│   ├── accumulator.js      # DailyAccumulator
│   ├── calendar.js         # CalendarView
│   ├── menu.js             # MenuController
│   └── main.js             # AppController（エントリポイント）
├── tests/
│   ├── utils.test.js       # formatTime / formatDate / getToday
│   ├── storage.test.js     # JSON シリアライズ ラウンドトリップ
│   └── accumulator.test.js # checkAndRollover ロジック
├── docs/                   # AI-DLC ドキュメント（既存）
├── package.json            # Jest テスト用（devDependency のみ）
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages 自動デプロイ
└── README.md
```

---

## PART 1: 実行ステップ

### Step 1: プロジェクト構造セットアップ
- [x] `package.json` 生成（Jest 設定、scripts: test）
- [x] `README.md` 生成（概要・使い方・デプロイ方法）
- [x] `.github/workflows/deploy.yml` 生成（GitHub Pages Actions）
- [x] `docs/construction/u1-core/code/code-summary.md` 生成（コードサマリー）

### Step 2: 共通ユーティリティ（`js/utils.js`）
- [x] `formatTime(totalSeconds: number): string` — HH:MM:SS 変換
- [x] `formatDate(date: Date): string` — YYYY-MM-DD 変換
- [x] `getToday(): string` — 今日の日付
- [x] `generateId(): string` — `crypto.randomUUID()` ラッパー

### Step 3: StorageGateway（`js/storage.js`）
- [x] プロジェクト一覧の読み書き（`getProjects` / `saveProjects`）
- [x] 日次記録の読み書き（`getDailyRecord` / `saveDailyRecord` / `getAllDailyRecords` / `saveAllDailyRecords`）
- [x] 削除済みプロジェクト管理（`addDeletedProject` / `getDeletedProject` / `getAllDeletedProjects`）
- [x] SessionSnapshot の読み書き（`getSession` / `saveSession` / `clearSession`）
- [x] Settings の読み書き（`getSettings` / `saveSettings`）
- [x] QuotaExceededError キャッチ・エラー通知

### Step 4: PrecisionTimer（`js/timer.js`）
- [x] `start(projectId)` — `Date.now()` を startTimestamp に記録
- [x] `stop()` — 停止・elapsedSeconds 返却
- [x] `checkpoint()` — 停止せずに elapsedSeconds 返却
- [x] `getElapsedSeconds()` — `Math.floor((Date.now() - startTimestamp) / 1000)`
- [x] `isRunning()` / `getActiveProjectId()`

### Step 5: ProjectManager（`js/projects.js`）
- [x] `load()` / `getAll()` / `get(id)`
- [x] `add(name, code?)` — バリデーション込み（BR-01）
- [x] `remove(id)`

### Step 6: DailyAccumulator（`js/accumulator.js`）
- [x] `loadToday()` — ストレージから当日データ読み込み
- [x] `add(projectId, seconds)` — 累積加算
- [x] `getTodayAccumulated(projectId)` / `getAllTodayAccumulated()`
- [x] `checkAndRollover()` — 日付変更検知とロールオーバー処理（BR-04/05）
- [x] `saveToday()` — ストレージへ保存
- [x] 2 年パージ呼び出し（PATTERN-03、`purgeOldData()`）

### Step 7: CalendarView（`js/calendar.js`）
- [x] `show()` / `hide()`
- [x] `renderMonth(year, month)` — カレンダーグリッド DOM 生成
- [x] `prevMonth()` / `nextMonth()`
- [x] `showDayDetail(date)` — プロジェクト別内訳ポップアップ

### Step 8: MenuController（`js/menu.js`）
- [x] `open()` / `close()` / `toggle()`
- [x] `showAddDialog()` / `handleAddSubmit(name, code?)`
- [x] `showDeleteConfirm(projectId)` / `handleDeleteConfirm(projectId)`

### Step 9: AppController（`js/main.js`）
- [x] `init()` — 起動処理・セッション復元・Page Visibility API 登録（PATTERN-01/05）
- [x] `beginWork()` — IDLE → ACTIVE 遷移（UC-02）
- [x] `endWork()` — ACTIVE → IDLE 遷移（UC-04）
- [x] `switchProject(projectId)` — プロジェクト切り替え（UC-03）
- [x] `updateTimerDisplay()` — 毎秒表示更新（UC-08）
- [x] `onProjectAdded(project)` / `onProjectDeleted(projectId)`
- [x] ボタン描画・状態管理（BR-08）

### Step 10: HTML（`index.html`）
- [x] 基本 HTML 構造（`<meta viewport>` / `<link>` / `<script type="module">`）
- [x] Header（アプリ名 + MenuButton、`data-testid` 付与）
- [x] SessionBar（始業ボタン / 終業ボタン、`data-testid` 付与）
- [x] ProjectButtonList コンテナ（`data-testid` 付与）
- [x] MenuPanel（スライドイン、プロジェクト追加/削除/カレンダーボタン）
- [x] AddProjectDialog / DeleteConfirmDialog（モーダル）
- [x] CalendarPanel（MonthNav / CalendarGrid / DayDetailPanel）

### Step 11: CSS（`css/style.css`）
- [x] CSS カスタムプロパティ（カラーパレット・スペーシング）
- [x] レスポンシブレイアウト（Flexbox / Grid）
- [x] ProjectButton スタイル（アクティブ状態ハイライト）
- [x] MenuPanel スライドインアニメーション
- [x] CalendarGrid スタイル
- [x] モーダル / ダイアログスタイル
- [x] モバイル最適化（44px タッチターゲット）

### Step 12: ユニットテスト（`tests/`）
- [x] `tests/utils.test.js` — `formatTime` / `formatDate` / `getToday` の境界値テスト
- [x] `tests/storage.test.js` — JSON シリアライズ ラウンドトリップ・QuotaExceededError ハンドリング
- [x] `tests/accumulator.test.js` — `checkAndRollover` 日付変更検知・ロールオーバー処理
- [x] テスト環境セットアップ（Jest + jsdom、`localStorage` モック）

### Step 13: ドキュメント / デプロイ
- [x] `README.md` — アプリ説明・使い方・GitHub Pages デプロイ手順
- [x] `.github/workflows/deploy.yml` — GitHub Actions による自動デプロイ設定
- [x] `docs/construction/u1-core/code/code-summary.md` — 実装サマリー

---

## 設計参照先

| 参照 | パス |
|---|---|
| ドメインエンティティ | `docs/construction/u1-core/functional-design/domain-entities.md` |
| ビジネスルール | `docs/construction/u1-core/functional-design/business-rules.md` |
| ビジネスロジックモデル | `docs/construction/u1-core/functional-design/business-logic-model.md` |
| フロントエンドコンポーネント | `docs/construction/u1-core/functional-design/frontend-components.md` |
| NFR デザインパターン | `docs/construction/u1-core/nfr-design/nfr-design-patterns.md` |
| 論理コンポーネント | `docs/construction/u1-core/nfr-design/logical-components.md` |
