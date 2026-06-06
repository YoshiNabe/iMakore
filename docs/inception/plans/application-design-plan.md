# iMakore — Application Design Plan

## 実行ステップ（チェックボックス）

- [x] Q1. JavaScript モジュール構成方針の確認（ES Modules 採用）
- [x] コンポーネント定義 (components.md)
- [x] コンポーネントメソッド定義 (component-methods.md)
- [x] サービス層定義 (services.md)
- [x] コンポーネント依存関係定義 (component-dependency.md)
- [x] 統合設計書生成 (application-design.md)
- [x] 設計完全性・整合性の検証

---

## 設計方針（提案）

### ファイル構成案

```
iMakore/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js          # エントリーポイント
    ├── storage.js       # StorageService
    ├── timer.js         # TimerEngine
    ├── projects.js      # ProjectManager
    ├── accumulator.js   # DailyAccumulator
    ├── calendar.js      # CalendarView
    ├── menu.js          # MenuController
    └── utils.js         # 共通ユーティリティ
```

### 主要コンポーネント（提案）

| コンポーネント | ファイル | 責務 |
|---|---|---|
| AppController | main.js | 全コンポーネントの初期化・イベント配線・セッション状態管理 |
| StorageService | storage.js | localStorage の読み書き・スキーマ管理 |
| TimerEngine | timer.js | アクティブプロジェクトの経過時間計測（`Date.now()` 基準） |
| DailyAccumulator | accumulator.js | 当日累積時間の管理・日次リセット処理 |
| ProjectManager | projects.js | プロジェクト CRUD |
| CalendarView | calendar.js | 月カレンダー表示・日別詳細表示 |
| MenuController | menu.js | メニュー開閉・プロジェクト登録削除ダイアログ |
| utils.js | utils.js | 時間フォーマット (HH:MM:SS)・日付ユーティリティ |

---

## 確認質問

### Question 1: JavaScript モジュール構成方針
バニラ JavaScript での複数ファイル管理方式を選択してください。

A) **ES Modules** (`<script type="module">`) を使用 — 各 .js ファイルで `import/export` を使用。モダンブラウザ対応。GitHub Pages で追加設定不要（推奨）
B) **単一ファイル** — すべての JavaScript を 1 つの app.js にまとめる。最もシンプル。ファイル数が増えると管理が難しくなる
C) **従来型 `<script>` タグ** — 複数ファイルを `index.html` に順番に `<script src="...">` で読み込む。ES Modules 不使用
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*回答が完了したら「完了しました」とお知らせください。*
