# iMakore U1-core — ビジネスロジックモデル

## ユースケース一覧

| ID | ユースケース | アクター | 前提条件 |
|---|---|---|---|
| UC-01 | アプリ起動 / セッション復元 | システム | — |
| UC-02 | 始業 | ユーザー | IDLE 状態、プロジェクト 1 件以上 |
| UC-03 | プロジェクト切り替え | ユーザー | ACTIVE 状態 |
| UC-04 | 終業 | ユーザー | ACTIVE 状態 |
| UC-05 | プロジェクト追加 | ユーザー | — |
| UC-06 | プロジェクト削除 | ユーザー | 対象プロジェクトが現在アクティブでないこと |
| UC-07 | カレンダー閲覧 | ユーザー | — |
| UC-08 | 毎秒タイマー更新 | システム | ACTIVE 状態 |

---

## UC-01: アプリ起動 / セッション復元

アプリの `<script type="module">` が読み込まれた時点で `AppController.init()` が実行される。

```
1. StorageService からプロジェクト一覧を読み込む
2. StorageService から削除済みプロジェクトマップを読み込む
3. DailyAccumulator.loadToday() で当日累積データを読み込む
4. SessionSnapshot を StorageService から読み込む
5. [分岐]
   5a. SessionSnapshot が null → IDLE 状態で UI を描画して終了
   5b. SessionSnapshot.sessionDate == 今日
       → TimerEngine.start(activeProjectId, projectStartTimestamp) でタイマー復元
       → ACTIVE 状態で UI を描画（該当プロジェクトボタンをアクティブに）
   5c. SessionSnapshot.sessionDate != 今日
       → DailyAccumulator.checkAndRollover() を実行して前日データを確定
       → SessionSnapshot をクリア（null に保存）
       → IDLE 状態で UI を描画
6. setInterval(updateTimerDisplay, 1000) でタイマー更新ループを開始する
```

---

## UC-02: 始業

```
1. DailyAccumulator.checkAndRollover() で日付変更チェック
2. ProjectManager.getAll()[0] で先頭プロジェクトを取得する
3. TimerEngine.start(firstProject.id) でタイマーを開始する
4. SessionSnapshot を作成して StorageService に保存する
   { activeProjectId: firstProject.id,
     projectStartTimestamp: Date.now(),
     sessionDate: getToday() }
5. セッション状態を ACTIVE に変更する
6. UI 更新: 始業ボタン非表示・終業ボタン表示・先頭プロジェクトボタンをアクティブ化
```

---

## UC-03: プロジェクト切り替え

引数: `newProjectId: string`（押下されたプロジェクトボタンの ID）

```
1. newProjectId == TimerEngine.getActiveProjectId() なら処理を中断する（同一プロジェクト）
2. DailyAccumulator.checkAndRollover() で日付変更チェック
3. TimerEngine.checkpoint() で現在プロジェクトの経過秒数を取得する
4. DailyAccumulator.add(currentProjectId, elapsedSeconds) で累積加算する
5. TimerEngine.start(newProjectId) で新プロジェクトのタイマーを開始する
6. SessionSnapshot を更新して StorageService に保存する
   { activeProjectId: newProjectId,
     projectStartTimestamp: Date.now(),
     sessionDate: getToday() }
7. UI 更新: 旧プロジェクトボタンを非アクティブ化・新プロジェクトボタンをアクティブ化
```

---

## UC-04: 終業

```
1. DailyAccumulator.checkAndRollover() で日付変更チェック
2. TimerEngine.stop() で経過秒数を取得する
3. DailyAccumulator.add(activeProjectId, elapsedSeconds) で最終累積加算する
4. DailyAccumulator.saveToday() で当日データを StorageService に永続化する
5. SessionSnapshot を null として StorageService に保存する
6. セッション状態を IDLE に変更する
7. UI 更新: 終業ボタン非表示・始業ボタン表示・全プロジェクトボタンを非アクティブ化
```

---

## UC-05: プロジェクト追加

引数: `name: string`, `code: string | null`

```
1. BR-01 のバリデーションを実行する
   → バリデーション失敗: エラーメッセージをダイアログ内に表示し、処理を中断する
2. ProjectManager.add(name.trim(), code?.trim() || null) でプロジェクトを作成する
3. StorageService にプロジェクト一覧を保存する
4. AppController.onProjectAdded(project) を呼び出す → メイン画面に新ボタンを追加描画する
5. 追加ダイアログを閉じる
```

---

## UC-06: プロジェクト削除

引数: `projectId: string`

```
1. 削除制約チェック: projectId == TimerEngine.getActiveProjectId() かつ ACTIVE 状態の場合
   → 「終業後に削除してください」のメッセージを表示して処理を中断する
2. 削除確認ダイアログを表示する
3. ユーザーが確認した場合:
   3a. StorageService.addDeletedProject(projectId, project.name) で削除済みマップに記録する
   3b. ProjectManager.remove(projectId) でプロジェクト一覧から削除する
   3c. StorageService にプロジェクト一覧を保存する
   3d. AppController.onProjectDeleted(projectId) を呼び出す → メイン画面からボタンを除去する
4. 確認ダイアログを閉じる
```

---

## UC-07: カレンダー閲覧

```
1. CalendarView.show() を呼び出す
2. StorageService.getAllDailyRecords() で全日次記録を読み込む
3. 当月のカレンダーグリッドを描画する
   - 各日付セルに: 日付番号・その日の総稼働時間（全プロジェクト合計、H:MM 形式）を表示する
   - 記録のない日は時間を表示しない
4. 日付セルがタップされた場合 (showDayDetail(date)):
   4a. その日の DailyRecord を取得する
   4b. 各プロジェクトエントリについて:
       - ProjectManager でプロジェクト名を検索する
       - 見つからない場合は StorageService.getDeletedProject(projectId) で名前を取得し
         「[削除済み] プロジェクト名」と表示する
   4c. プロジェクト別内訳リストをポップアップで表示する（プロジェクト名・稼働時間）
```

---

## UC-08: 毎秒タイマー更新

`setInterval(1000)` によって毎秒呼び出される。

```
1. DailyAccumulator.checkAndRollover() で日付変更チェック（深夜 0 時の次操作時処理）
2. TimerEngine.getElapsedSeconds() で現在アクティブプロジェクトの経過秒数を取得する
3. DailyAccumulator.getAllTodayAccumulated() で全プロジェクトの累積秒数を取得する
4. 各プロジェクトボタンの時間表示を更新する:
   - アクティブボタン: (累積秒数 + 経過秒数) を HH:MM:SS 形式で表示する
   - 非アクティブボタン: 累積秒数を HH:MM:SS 形式で表示する
```
