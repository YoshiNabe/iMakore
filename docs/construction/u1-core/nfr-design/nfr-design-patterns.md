# iMakore U1-core — NFR デザインパターン

## PATTERN-01: 精度保証タイマーパターン

**対応 NFR**: NFR-P-01（毎秒更新）、NFR-P-02（バックグラウンド最適化）

**課題**: `setInterval(1000)` は累積誤差・タブスロットリング・スリープ復帰により実際の経過秒数とずれる。

**解法**: 表示更新のトリガーに `setInterval` を使用するが、時刻の計算は常に `Date.now()` との差分で行う。

```
TimerEngine の動作:
  start(projectId):
    startTimestamp = Date.now()
    activeProjectId = projectId

  getElapsedSeconds():
    return Math.floor((Date.now() - startTimestamp) / 1000)
    // setInterval の累積誤差を一切受けない
```

**Page Visibility API との連携**:

```
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(tickInterval)   // setInterval を停止
  } else {
    updateTimerDisplay()          // 再表示時に即座に正確な値を更新
    tickInterval = setInterval(updateTimerDisplay, 1000)  // 再開
  }
})
```

タブが非表示の間も `Date.now()` は進み続けるため、復帰後は正確な経過時間が即座に表示される。

---

## PATTERN-02: ストレージレジリエンスパターン

**対応 NFR**: NFR-S-02（容量見積）、NFR-S-03（QuotaExceededError 処理）

**課題**: `localStorage.setItem()` は容量超過時に `QuotaExceededError` をスローする。

**解法**: すべての `setItem()` 呼び出しを try-catch でラップし、エラー発生時はユーザーに通知する。

```
StorageService のすべての書き込みメソッドで:
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showStorageErrorNotification()
      // アプリの動作は継続する（読み取りは影響なし）
    }
  }
```

**既知の制限 — 複数タブ非対応**:
複数タブで iMakore を同時に開いた場合、タブ間でデータが競合する可能性がある。個人利用ツールとして複数タブでの同時使用は想定しないため、この制限は許容する。ユーザーは 1 タブでのみ使用すること。

---

## PATTERN-03: 2 年ローリングパージパターン

**対応 NFR**: NFR-S-01（2 年データ保持）

**適用タイミング**: `AppController.init()` — アプリ起動のたびに実行する。

**実装方針**:

```
purgeOldData():
  cutoffDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)  // 2年前
  cutoffString = formatDate(cutoffDate)                             // 'YYYY-MM-DD'
  allRecords = StorageService.getAllDailyRecords()
  keysToDelete = Object.keys(allRecords).filter(date => date < cutoffString)
  keysToDelete.forEach(date => delete allRecords[date])
  if (keysToDelete.length > 0) {
    StorageService.saveAllDailyRecords(allRecords)
    console.log(`Purged ${keysToDelete.length} old daily records`)
  }
```

文字列比較（`'YYYY-MM-DD' < 'YYYY-MM-DD'`）は辞書順 = 日付順で正しく機能する。

---

## PATTERN-04: XSS 防止パターン

**対応 NFR**: 最小限のセキュリティ（Security Baseline 無効だが基本的 Web 安全実践として適用）

**課題**: プロジェクト名・コードはユーザー入力であり、DOM に反映する際に XSS リスクがある。

**解法**: DOM 操作はすべて `textContent` / `value` を使用し、`innerHTML` は使用しない。

```
// ✅ 正しい
button.querySelector('.project-name').textContent = project.name

// ❌ 禁止
button.innerHTML = `<span>${project.name}</span>`
```

HTML エレメントの生成にテンプレートリテラルを使う場合は `createElement` + `textContent` の組み合わせのみ使用する。

---

## PATTERN-05: セッション永続化パターン

**対応 NFR**: 機能要件 BR-05（ブラウザ再起動時のセッション復元）

**SessionSnapshot の保存タイミング**:
- 始業ボタン押下時
- プロジェクト切り替え時（activeProjectId と projectStartTimestamp を更新）

**SessionSnapshot のクリアタイミング**:
- 終業ボタン押下時
- 日付をまたいでいる場合の起動時

**ロールオーバー時の処理フロー**:

```
起動時に sessionDate != today の場合:
  1. midnightMs = new Date(sessionDate + 'T23:59:59.999').getTime() + 1
  2. elapsedToMidnight = Math.floor((midnightMs - projectStartTimestamp) / 1000)
  3. 前日の DailyRecord に elapsedToMidnight 秒を加算して保存する
  4. SessionSnapshot を null にクリアする
  5. IDLE 状態で起動する
```
