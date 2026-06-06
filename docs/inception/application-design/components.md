# iMakore — コンポーネント定義

## ファイル構成

```
iMakore/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js         # AppController
    ├── storage.js      # StorageService
    ├── timer.js        # TimerEngine
    ├── projects.js     # ProjectManager
    ├── accumulator.js  # DailyAccumulator
    ├── calendar.js     # CalendarView
    ├── menu.js         # MenuController
    └── utils.js        # 共通ユーティリティ
```

モジュール方式: ES Modules (`<script type="module">`)

---

## コンポーネント一覧

### AppController (`js/main.js`)

アプリケーション全体のエントリーポイント。全コンポーネントを初期化し、DOM イベントと各コンポーネントの処理を配線する。作業セッションの状態（IDLE / ACTIVE）を管理する。

**責務:**
- アプリ起動時の初期化処理（ストレージからデータ読み込み、プロジェクトボタン描画、日付変更チェック）
- 始業（IDLE → ACTIVE 遷移）・終業（ACTIVE → IDLE 遷移）処理
- プロジェクト切り替え時のタイマー引き継ぎ処理
- タイマー表示の毎秒更新

**セッション状態:**
- `IDLE`: 始業前または終業後。いずれのプロジェクトボタンもアクティブでない。
- `ACTIVE`: 始業後。必ず 1 つのプロジェクトボタンがアクティブ。

---

### StorageService (`js/storage.js`)

localStorage へのすべてのデータ読み書きを担当する。データスキーマの管理とシリアライズ / デシリアライズを行う。

**責務:**
- プロジェクト一覧の永続化
- 日次累積記録（日付 → プロジェクト別秒数）の永続化
- アプリ設定の永続化
- スキーマバージョン管理

**localStorage キー設計:**
| キー | 型 | 内容 |
|---|---|---|
| `imakore_projects` | `Project[]` (JSON) | 登録プロジェクト一覧 |
| `imakore_daily` | `{ [date: string]: DailyRecord }` (JSON) | 日次累積記録（全日分）|
| `imakore_settings` | `Settings` (JSON) | バージョン等の設定 |

---

### TimerEngine (`js/timer.js`)

アクティブなプロジェクトの経過時間を `Date.now()` 基準で計測する。`setInterval` を UI 表示更新にのみ使用し、時刻の基準は常に `Date.now()` とすることでスリープ復帰後も正確な値を保つ。

**責務:**
- タイマー開始・停止・チェックポイント取得
- 経過秒数の計算（`Date.now() - startTimestamp` ÷ 1000）
- スリープ復帰後の自動補正（`Date.now()` ベースのため追加処理不要）

---

### DailyAccumulator (`js/accumulator.js`)

当日のプロジェクト別累積時間を管理する。日付変更（深夜 0 時）を検知し、前日データを StorageService に保存してから当日カウンターをリセットする。

**責務:**
- プロジェクトごとの当日累積秒数の保持（メモリ上）
- タイマー停止時の累積加算
- 日付変更の検知と日次リセット処理
- 起動時の当日データのストレージからの復元

---

### ProjectManager (`js/projects.js`)

登録済みプロジェクトの CRUD 操作を担当する。

**責務:**
- プロジェクト追加（名前必須・コード任意）
- プロジェクト削除
- プロジェクト一覧取得
- 変更後の StorageService への即時保存

---

### CalendarView (`js/calendar.js`)

アプリ内蔵の月カレンダーを描画し、過去の日次集計を表示する。

**責務:**
- 月カレンダー（グリッド）の DOM 生成と表示
- 前月・次月へのナビゲーション
- 各日付セルへの当日総稼働時間表示
- 日付タップ時のプロジェクト別内訳ポップアップ表示

---

### MenuController (`js/menu.js`)

ハンバーガーメニューの開閉とプロジェクト管理ダイアログを担当する。

**責務:**
- メニューパネルの開閉状態管理
- プロジェクト追加フォームの表示・送信処理
- プロジェクト削除確認ダイアログの表示・処理

---

### utils.js (`js/utils.js`)

アプリ全体で使用する共通ユーティリティ関数群。副作用を持たない純粋関数のみ。

**責務:**
- 秒数 → HH:MM:SS 形式への変換
- Date → YYYY-MM-DD 形式への変換
- 当日日付文字列の取得
- 簡易 ID 生成（`crypto.randomUUID()` ラッパー）
