# iMakore — コンポーネントメソッド定義

詳細なビジネスロジックは CONSTRUCTION フェーズの Functional Design で定義する。
ここでは各コンポーネントのメソッドシグネチャと高レベルの目的を示す。

## 型定義

```typescript
// 設計上の型定義（実装は vanilla JS）
type Project = {
  id: string;        // crypto.randomUUID() で生成
  name: string;      // 必須
  code: string | null; // 任意の社内プロジェクトコード
};

type DailyRecord = {
  [projectId: string]: number; // 当日の累積秒数
};

type SessionState = 'IDLE' | 'ACTIVE';
```

---

## AppController (`js/main.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `init()` | なし | `void` | アプリ起動時の初期化。ストレージからデータ読み込み、プロジェクトボタン描画、日付変更チェック |
| `beginWork()` | なし | `void` | IDLE → ACTIVE 遷移。最初のプロジェクトボタンを自動選択 |
| `endWork()` | なし | `void` | ACTIVE → IDLE 遷移。タイマー停止・累積保存・UI 更新 |
| `switchProject(projectId)` | `projectId: string` | `void` | アクティブプロジェクト切り替え。現プロジェクトの経過時間を累積に加算してから新プロジェクトを開始 |
| `updateTimerDisplay()` | なし | `void` | 毎秒呼ばれる表示更新。アクティブボタンの経過時間と全ボタンの累積時間を更新 |
| `onProjectAdded(project)` | `project: Project` | `void` | ProjectManager からの追加通知を受けてボタンを描画 |
| `onProjectDeleted(projectId)` | `projectId: string` | `void` | ProjectManager からの削除通知を受けてボタンを除去 |
| `getSessionState()` | なし | `SessionState` | 現在のセッション状態を返す |

---

## StorageService (`js/storage.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `getProjects()` | なし | `Project[]` | 登録済みプロジェクト一覧を読み込む |
| `saveProjects(projects)` | `projects: Project[]` | `void` | プロジェクト一覧を保存する |
| `getDailyRecord(date)` | `date: string` (YYYY-MM-DD) | `DailyRecord` | 指定日の累積記録を読み込む |
| `saveDailyRecord(date, record)` | `date: string`, `record: DailyRecord` | `void` | 指定日の累積記録を保存する |
| `getAllDailyRecords()` | なし | `{ [date: string]: DailyRecord }` | 全日付の累積記録を読み込む（カレンダー用）|
| `getSettings()` | なし | `Settings` | アプリ設定を読み込む |
| `saveSettings(settings)` | `settings: Settings` | `void` | アプリ設定を保存する |

---

## TimerEngine (`js/timer.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `start(projectId)` | `projectId: string` | `void` | 指定プロジェクトの計測を開始する。開始時刻として `Date.now()` を記録 |
| `stop()` | なし | `{ projectId: string, elapsedSeconds: number }` | 計測を停止し、プロジェクト ID と経過秒数を返す |
| `checkpoint()` | なし | `{ projectId: string, elapsedSeconds: number }` | 計測を停止せずに現時点の経過秒数を返す（切り替え前の累積加算用）|
| `getElapsedSeconds()` | なし | `number` | `(Date.now() - startTimestamp) / 1000` を返す |
| `isRunning()` | なし | `boolean` | タイマーが稼働中かどうかを返す |
| `getActiveProjectId()` | なし | `string \| null` | 現在計測中のプロジェクト ID を返す |

---

## DailyAccumulator (`js/accumulator.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `loadToday()` | なし | `void` | 起動時にストレージから当日データを読み込む |
| `add(projectId, seconds)` | `projectId: string`, `seconds: number` | `void` | 指定プロジェクトの当日累積秒数に加算する |
| `getTodayAccumulated(projectId)` | `projectId: string` | `number` | 指定プロジェクトの当日累積秒数を返す |
| `getAllTodayAccumulated()` | なし | `DailyRecord` | 全プロジェクトの当日累積記録を返す |
| `checkAndRollover()` | なし | `void` | 前回更新時と日付が変わっていれば前日データを保存してリセットする |
| `saveToday()` | なし | `void` | 当日の累積データをストレージに保存する |

---

## ProjectManager (`js/projects.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `load()` | なし | `void` | ストレージからプロジェクト一覧を読み込む |
| `getAll()` | なし | `Project[]` | 登録済みプロジェクト全件を返す |
| `get(id)` | `id: string` | `Project \| null` | 指定 ID のプロジェクトを返す |
| `add(name, code?)` | `name: string`, `code?: string` | `Project` | 新規プロジェクトを追加してストレージに保存する |
| `remove(id)` | `id: string` | `void` | 指定プロジェクトを削除してストレージに保存する |

---

## CalendarView (`js/calendar.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `show()` | なし | `void` | カレンダーパネルを表示し、当月を描画する |
| `hide()` | なし | `void` | カレンダーパネルを非表示にする |
| `renderMonth(year, month)` | `year: number`, `month: number` | `void` | 指定年月のカレンダーグリッドを DOM に描画する |
| `prevMonth()` | なし | `void` | 前月に移動して再描画する |
| `nextMonth()` | なし | `void` | 次月に移動して再描画する |
| `showDayDetail(date)` | `date: string` (YYYY-MM-DD) | `void` | 指定日のプロジェクト別内訳をポップアップ表示する |

---

## MenuController (`js/menu.js`)

| メソッド | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `open()` | なし | `void` | メニューパネルを開く |
| `close()` | なし | `void` | メニューパネルを閉じる |
| `toggle()` | なし | `void` | メニューの開閉を切り替える |
| `showAddDialog()` | なし | `void` | プロジェクト追加ダイアログを表示する |
| `handleAddSubmit(name, code?)` | `name: string`, `code?: string` | `void` | 追加フォームの送信を処理し、ProjectManager に委譲する |
| `showDeleteConfirm(projectId)` | `projectId: string` | `void` | 削除確認ダイアログを表示する |
| `handleDeleteConfirm(projectId)` | `projectId: string` | `void` | 削除確認後、ProjectManager に委譲する |

---

## utils.js (`js/utils.js`)

| 関数 | 引数 | 戻り値 | 目的 |
|---|---|---|---|
| `formatTime(totalSeconds)` | `totalSeconds: number` | `string` | 秒数を "HH:MM:SS" 形式に変換する |
| `formatDate(date)` | `date: Date` | `string` | Date オブジェクトを "YYYY-MM-DD" 形式に変換する |
| `getToday()` | なし | `string` | 今日の日付を "YYYY-MM-DD" で返す |
| `generateId()` | なし | `string` | `crypto.randomUUID()` を使い一意な ID を生成する |
