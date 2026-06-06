# iMakore U1-core — 非機能要件

## NFR-P: パフォーマンス

### NFR-P-01: タイマー表示更新

- タブがアクティブ（可視）の場合、プロジェクトボタンの時間表示を **毎秒 1 回**更新する。
- 時刻の計算は常に `Date.now()` 差分で行い、`setInterval` のドリフト（遅延蓄積）の影響を受けない。

### NFR-P-02: バックグラウンドタブ最適化（Page Visibility API）

- `document.visibilitychange` イベントを監視し、タブが非表示になった時点で `setInterval` を停止する。
- タブが再表示されたとき、`Date.now()` で正確な経過時間を即時計算し、タイマー表示を一括更新してから `setInterval` を再開する。
- これによりバックグラウンドタブでの CPU 消費・バッテリー消耗を抑える。

### NFR-P-03: 起動速度

- アプリの初期描画（最初のプロジェクトボタン表示）は **100 ミリ秒以内**を目標とする。
- localStorage の読み込みは同期 API のため、データ量が増えても影響は軽微。

---

## NFR-S: ストレージ

### NFR-S-01: データ保持期間（2 年ローリング）

- アプリ起動時に `imakore_daily` から **2 年以上前**の日付エントリを自動削除する。
- 対象: `Date.now()` から 730 日（365×2）より古い `YYYY-MM-DD` キー。
- 削除前に該当件数をコンソールログに出力する（デバッグ用）。

### NFR-S-02: ストレージ容量見積もり

想定最大データ量（2 年間・100 プロジェクト登録時）:

| データ種別 | 見積もりサイズ |
|---|---|
| `imakore_projects`（100 件）| ≒ 15 KB |
| `imakore_daily`（2 年 × 100 プロジェクト）| ≒ 3.6 MB |
| `imakore_deleted`・`imakore_session`・`imakore_settings` | ≒ 5 KB |
| **合計** | **≒ 3.6 MB**（上限 5 MB の 72%）|

### NFR-S-03: ストレージエラー処理

- `localStorage.setItem()` が `QuotaExceededError` をスローした場合、ユーザーに「ストレージ容量が不足しています。古いデータを手動で削除してください。」と通知する。
- アプリの動作を継続できる範囲でエラーを処理し、クラッシュを避ける。

---

## NFR-B: ブラウザ互換性

### NFR-B-01: 対応ブラウザ

| ブラウザ | 最低バージョン | 根拠 |
|---|---|---|
| Chrome | 92 以上 | `crypto.randomUUID()` 対応 |
| Firefox | 95 以上 | `crypto.randomUUID()` 対応（90 は未対応）|
| Safari | 15.4 以上 | `crypto.randomUUID()` 対応 |
| Edge | 92 以上 | `crypto.randomUUID()` 対応（Chromium ベース）|
| IE | **非対応** | ES Modules 未対応 |

**依存 Web API:**

| API | 用途 | 対応状況 |
|---|---|---|
| ES Modules (`type="module"`) | モジュール分割 | 対象ブラウザ全対応 |
| `crypto.randomUUID()` | プロジェクト ID 生成 | 対象ブラウザ全対応 |
| `localStorage` | データ永続化 | 全ブラウザ対応 |
| Page Visibility API | バックグラウンド最適化 | 対象ブラウザ全対応 |

---

## NFR-U: ユーザビリティ

### NFR-U-01: レスポンシブ対応

- スマートフォン（320px〜）・タブレット・PC の全画面幅で正常に表示・操作できる。
- プロジェクトボタンの最小タッチターゲットサイズは **44×44 px**（iOS Human Interface Guidelines 準拠）。

### NFR-U-02: オフライン動作

- すべての機能はインターネット接続なしで動作する。
- 外部 CDN からのフォント・スクリプト読み込みは行わない。

---

## NFR-M: 保守性

### NFR-M-01: テスト対象

部分適用 PBT（純粋関数・シリアライゼーション）の対象とする関数:

- `utils.js`: `formatTime(seconds)`, `formatDate(date)`, `getToday()`
- `storage.js`: JSON シリアライズ / デシリアライズのラウンドトリップ
- `accumulator.js`: `checkAndRollover()` の日付変更検知ロジック（純粋関数部分）

### NFR-M-02: ビルドツール不使用

- ビルドステップなし。`index.html` を GitHub Pages に直接配置して動作する。
- `npm install` 不要。テスト実行のみ Node.js 環境（任意）が必要。
