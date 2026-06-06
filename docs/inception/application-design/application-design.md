# iMakore — アプリケーション設計（統合）

> [components.md](components.md) | [component-methods.md](component-methods.md) | [services.md](services.md) | [component-dependency.md](component-dependency.md)

## 設計概要

iMakore はバニラ HTML/CSS/JavaScript で実装するシングルページ Web アプリ。
ES Modules (`<script type="module">`) を使用し、論理単位ごとにファイルを分割する。
外部依存・ビルドツール不使用。GitHub Pages に直接デプロイ可能。

---

## コンポーネント構成

| コンポーネント | ファイル | 分類 | 主な責務 |
|---|---|---|---|
| AppController | js/main.js | オーケストレーター | セッション状態管理・全コンポーネント配線 |
| StorageService | js/storage.js | コアサービス | localStorage 読み書き |
| TimerEngine | js/timer.js | コアサービス | 経過時間計測（`Date.now()` 基準）|
| DailyAccumulator | js/accumulator.js | ドメインロジック | 当日累積・日次リセット |
| ProjectManager | js/projects.js | ドメインロジック | プロジェクト CRUD |
| CalendarView | js/calendar.js | UI | 月カレンダー描画・日別詳細 |
| MenuController | js/menu.js | UI | メニュー・ダイアログ管理 |
| utils.js | js/utils.js | ユーティリティ | 時間/日付フォーマット・ID 生成 |

---

## セッション状態マシン

```
[初回起動]
     ↓
  IDLE 状態
  - 始業ボタン表示
  - 全プロジェクトボタン非アクティブ
  - 前日以前の累積は 0 表示（当日分のみ）
     ↓ [始業ボタン押下]
  ACTIVE 状態
  - 終業ボタン表示
  - 1 つのプロジェクトボタンがアクティブ（必須）
  - アクティブボタンに経過時間をリアルタイム表示
  - 全ボタンに当日累積時間を表示
     ↓ [終業ボタン押下]
  IDLE 状態（戻る）
  - 当日データをストレージに保存
```

---

## データスキーマ（localStorage）

```js
// imakore_projects (JSON 配列)
[
  { id: "uuid-xxx", name: "プロジェクト A", code: "PROJ-001" },
  { id: "uuid-yyy", name: "社内業務", code: null }
]

// imakore_daily (JSON オブジェクト)
{
  "2026-06-06": { "uuid-xxx": 3600, "uuid-yyy": 1800 },
  "2026-06-05": { "uuid-xxx": 7200 }
}

// imakore_settings (JSON オブジェクト)
{ version: 1 }
```

---

## 主要な設計決定

### タイマー精度
`setInterval(1000)` で毎秒表示更新を行うが、**実際の経過秒数は `Date.now()` 差分で計算**する。これにより、バックグラウンドタブやデバイスのスリープ後も正確な値を保つ。

`elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000)`

### 日次リセット
明示的なリセット処理を 0 時に走らせるのではなく、**アプリ起動時または毎秒更新時に `checkAndRollover()` を呼び出す**ことで日付変更を検知してリセットする。これにより、ブラウザを開きっぱなしにしていても 0 時をまたいだ瞬間に正しくリセットされる。

### 始業後の初期プロジェクト選択
始業ボタン押下後、プロジェクトが 1 件以上登録されている場合は**一覧の先頭プロジェクトを自動でアクティブ化**する。ユーザーはその後任意のプロジェクトに切り替える。
（プロジェクトが 0 件の場合は始業ボタンを非活性化し、先にプロジェクトを登録するよう促す）

---

## 設計参照先

| 成果物 | パス |
|---|---|
| コンポーネント定義 | [components.md](components.md) |
| メソッドシグネチャ | [component-methods.md](component-methods.md) |
| サービス層 | [services.md](services.md) |
| 依存関係・データフロー | [component-dependency.md](component-dependency.md) |
| 要件定義 | [../requirements/requirements.md](../requirements/requirements.md) |
