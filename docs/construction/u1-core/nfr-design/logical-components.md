# iMakore U1-core — 論理コンポーネント

iMakore はサーバー・インフラ不使用の静的 Web アプリのため、論理コンポーネントはブラウザ内の JS モジュールとして実現する。キュー・キャッシュ・サーキットブレーカーは対象外。

---

## 論理コンポーネント一覧

### LC-01: StorageGateway（`js/storage.js`）

localStorage への唯一のアクセス窓口。すべての読み書きをこのコンポーネント経由で行う。

**担当パターン**: PATTERN-02（ストレージレジリエンス）、PATTERN-03（2 年パージ）

**責務:**
- `localStorage` の JSON シリアライズ / デシリアライズ
- `QuotaExceededError` のキャッチとエラー通知
- `getAllDailyRecords()` / `saveAllDailyRecords()` による日次記録の一括操作
- `addDeletedProject(id, name)` / `getDeletedProject(id)` による削除済みプロジェクトの名前管理

**外部から直接 `localStorage` を操作してはならない。** このルールをアプリ全体で守ることで、スキーマ変更の影響を StorageGateway の内部に閉じ込める。

---

### LC-02: PrecisionTimer（`js/timer.js`）

`Date.now()` を基準にした精度保証タイマーサービス。

**担当パターン**: PATTERN-01（精度保証タイマー）

**内部状態:**
- `startTimestamp: number | null` — 現在のプロジェクト計測開始時刻（ms）
- `activeProjectId: string | null` — 計測中のプロジェクト ID

**設計上の不変条件（invariant）:**
- `isRunning()` が `true` の間、`startTimestamp` は必ず非 null である。
- `getElapsedSeconds()` の計算に `setInterval` の内部カウンターは使用しない。

---

### LC-03: DailyAccumulator（`js/accumulator.js`）

当日のプロジェクト別累積秒数をメモリ上で管理し、適切なタイミングでストレージに同期する。

**担当パターン**: PATTERN-03（2 年パージ）、PATTERN-05（ロールオーバー）

**内部状態:**
- `todayAccumulated: { [projectId: string]: number }` — メモリ上の当日累積
- `currentDate: string` — 基準日（YYYY-MM-DD）、日付変更検知に使用

**`checkAndRollover()` の呼び出しタイミング（LC-04 が制御）:**
始業・切り替え・終業・毎秒更新のすべてのエントリポイントで呼び出す。

---

### LC-04: AppController（`js/main.js`）

唯一のオーケストレーター。UI イベントと各論理コンポーネントの処理を配線する。

**担当パターン**: PATTERN-01（setInterval + Page Visibility API の制御）、PATTERN-05（セッション永続化）

**ライフサイクル管理:**

```
init():
  1. StorageGateway からデータ読み込み
  2. purgeOldData()（PATTERN-03）
  3. SessionSnapshot の復元判定（PATTERN-05）
  4. Page Visibility API のイベントリスナー登録（PATTERN-01）
  5. setInterval(updateTimerDisplay, 1000) 開始
  6. UI 初期描画
```

**Page Visibility API イベントハンドラ:**
`visibilitychange` → hidden 時は `clearInterval`、visible 時は即時表示更新 + `setInterval` 再開（PATTERN-01）。

---

### LC-05: ContentSanitizer（`js/utils.js` 内の規約）

独立したモジュールではなく、開発規約として全コンポーネントに適用するパターン。

**担当パターン**: PATTERN-04（XSS 防止）

**規約:**
- DOM へのユーザー入力の反映は必ず `textContent` を使用する。
- 動的 HTML 生成には `document.createElement()` + `textContent` の組み合わせのみ許可する。
- `innerHTML` へのユーザー入力の直接代入は全面禁止。
- `insertAdjacentHTML()` 等のエスケープなし HTML 挿入 API も禁止。

---

## コンポーネント間の依存関係（再掲）

```
AppController (LC-04)
  ├── StorageGateway (LC-01)   ← データの永続化
  ├── PrecisionTimer (LC-02)   ← 経過時間の計測
  ├── DailyAccumulator (LC-03) ← 当日累積の管理
  ├── ProjectManager           ← プロジェクト CRUD
  ├── CalendarView             ← カレンダー表示
  └── MenuController           ← メニュー・ダイアログ

DailyAccumulator (LC-03)
  └── StorageGateway (LC-01)

ProjectManager
  └── StorageGateway (LC-01)

CalendarView
  └── StorageGateway (LC-01)
```

ContentSanitizer（LC-05）は規約として全コンポーネントに横断適用する。
