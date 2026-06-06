# iMakore — コンポーネント依存関係

## 依存マトリクス

| コンポーネント | 依存先 | 依存種別 |
|---|---|---|
| AppController | StorageService, TimerEngine, DailyAccumulator, ProjectManager, CalendarView, MenuController | 直接参照（初期化時に注入）|
| ProjectManager | StorageService | 直接参照 |
| DailyAccumulator | StorageService | 直接参照 |
| CalendarView | StorageService | 直接参照 |
| MenuController | ProjectManager | コールバック経由 |
| TimerEngine | なし | — |
| StorageService | なし | — |
| utils.js | なし | — |

AppController が唯一の「知りすぎるコンポーネント」となるが、単一ページアプリとして妥当な設計である。TimerEngine と StorageService は外部依存を持たない独立したコアサービス。

---

## データフロー

```
[始業ボタン押下]
  AppController.beginWork()
    → DailyAccumulator.checkAndRollover()   # 日付変更チェック
    → ProjectManager.getAll()               # 最初のプロジェクト取得
    → TimerEngine.start(projectId)          # 計測開始
    → DOM: 始業ボタン非表示、終業ボタン表示、最初のプロジェクトボタンをアクティブ化

[プロジェクトボタン押下]
  AppController.switchProject(newProjectId)
    → TimerEngine.checkpoint()              # 現プロジェクトの経過秒数取得
    → DailyAccumulator.add(prevId, secs)    # 旧プロジェクトに累積加算
    → TimerEngine.start(newProjectId)       # 新プロジェクトの計測開始
    → DOM: ボタンのアクティブ状態を更新

[毎秒タイマー]
  AppController.updateTimerDisplay()
    → TimerEngine.getElapsedSeconds()       # アクティブプロジェクトの経過秒数
    → DailyAccumulator.getAllTodayAccumulated() # 全プロジェクトの累積秒数
    → DOM: 全ボタンの時間表示を更新

[終業ボタン押下]
  AppController.endWork()
    → TimerEngine.stop()                    # 計測停止・経過秒数取得
    → DailyAccumulator.add(projectId, secs) # 最終累積加算
    → DailyAccumulator.saveToday()          # ストレージに保存
    → DOM: 終業ボタン非表示、始業ボタン表示、全ボタン非アクティブ化

[プロジェクト追加]
  MenuController → handleAddSubmit()
    → ProjectManager.add(name, code)        # プロジェクト作成・ストレージ保存
    → AppController.onProjectAdded(project) # 新ボタンを DOM に追加

[カレンダー表示]
  CalendarView.show()
    → StorageService.getAllDailyRecords()    # 全日次データ読み込み
    → DOM: 月カレンダーを描画
```

---

## 通信パターン

- **AppController → コンポーネント**: 直接メソッド呼び出し（同期）
- **MenuController → AppController**: コールバック関数（プロジェクト追加・削除通知）
- **コンポーネント → StorageService**: 直接メソッド呼び出し（同期、localStorage は同期 API）
- **タイマー更新**: `setInterval(1000)` → `AppController.updateTimerDisplay()`
