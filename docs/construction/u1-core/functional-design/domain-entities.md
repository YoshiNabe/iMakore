# iMakore U1-core — ドメインエンティティ

## エンティティ一覧

### Project

登録されたプロジェクトを表すエンティティ。

| 属性 | 型 | 必須 | 制約 |
|---|---|---|---|
| `id` | `string` | 必須 | `crypto.randomUUID()` で生成。変更不可 |
| `name` | `string` | 必須 | 1〜50 文字。前後の空白をトリム後に検証 |
| `code` | `string \| null` | 任意 | null 可。入力時は 1〜20 文字。入力後に空白のみなら null として扱う |

---

### DailyRecord

ある 1 日のプロジェクト別累積稼働秒数を表すエンティティ。

| 属性 | 型 | 説明 |
|---|---|---|
| `[projectId: string]` | `number` | そのプロジェクトの当日累積秒数（非負整数）|

- 1 つの DailyRecord は 1 日 / 1 プロジェクト識別子ごとに 1 エントリを持つ。
- プロジェクト ID が削除済みプロジェクトのものであっても、エントリは保持される（履歴保持ポリシー）。

---

### SessionSnapshot

ブラウザ再起動後のセッション復元に使用する状態スナップショット。アクティブセッションが存在する間のみ保存される。

| 属性 | 型 | 説明 |
|---|---|---|
| `activeProjectId` | `string` | 現在アクティブなプロジェクトの ID |
| `projectStartTimestamp` | `number` | 現在のプロジェクトの計測開始時刻（`Date.now()` ミリ秒）|
| `sessionDate` | `string` | セッションが開始された日付（YYYY-MM-DD）。日付変更検知に使用 |

---

### Settings

アプリ設定を表すエンティティ。将来の拡張のために保持する。

| 属性 | 型 | 説明 |
|---|---|---|
| `version` | `number` | ストレージスキーマのバージョン番号（現在: 1）|

---

## localStorage スキーマ

| キー | 型 | 内容 |
|---|---|---|
| `imakore_projects` | `Project[]` | 登録済みプロジェクト一覧 |
| `imakore_daily` | `{ [date: string]: DailyRecord }` | 全日付の日次累積記録 |
| `imakore_deleted` | `{ [projectId: string]: string }` | 削除済みプロジェクトの ID → 名前マップ |
| `imakore_session` | `SessionSnapshot \| null` | アクティブセッションのスナップショット |
| `imakore_settings` | `Settings` | アプリ設定 |

---

## セッション状態

アプリのセッション状態は `SessionSnapshot` の有無と組み合わせて以下の 2 つのみ。

| 状態 | 説明 | `imakore_session` |
|---|---|---|
| `IDLE` | 始業前または終業後。タイマー停止中 | `null` |
| `ACTIVE` | 始業後。1 つのプロジェクトが計測中 | `SessionSnapshot` オブジェクト |
