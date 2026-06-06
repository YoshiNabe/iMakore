# iMakore — サービス層定義

iMakore はシンプルな単一ページアプリであるため、独立したサービス層は 2 つのコアサービス（StorageService・TimerEngine）が担う。その他のコンポーネントはこの 2 サービスを利用する形でオーケストレーションする。

---

## StorageService (`js/storage.js`)

すべての永続化処理を一元管理するサービス。アプリ内のどのコンポーネントも localStorage へ直接アクセスせず、必ず StorageService 経由でデータを操作する。

**役割:**
- 型安全な localStorage の読み書きラッパー（JSON シリアライズ / デシリアライズ）
- スキーマバージョン管理（将来のデータ移行に備える）
- 読み取り失敗時のデフォルト値返却（データ破損への耐性）

**利用するコンポーネント:**
- ProjectManager（プロジェクト一覧の保存・読み込み）
- DailyAccumulator（日次累積データの保存・読み込み）
- CalendarView（全日次記録の読み込み）
- AppController（初期化時の設定読み込み）

---

## TimerEngine (`js/timer.js`)

アクティブプロジェクトの経過時間計測を担うサービス。`Date.now()` を基準にすることで、`setInterval` のドリフトやブラウザのスリープによる遅延を受けない正確な計測を実現する。

**役割:**
- プロジェクトの計測開始・停止・チェックポイント取得
- 経過秒数の計算（`Math.floor((Date.now() - startTimestamp) / 1000)`）
- 計測状態（計測中のプロジェクト ID・開始タイムスタンプ）の保持

**利用するコンポーネント:**
- AppController（タイマー制御・切り替え時の経過秒数取得）
- DailyAccumulator（停止時の経過秒数を受け取って累積に加算）

---

## オーケストレーション構造

AppController がすべてのコンポーネントを保持し、ユーザー操作イベントに応じてサービスと UI コンポーネントを協調させる。

```
ユーザー操作（DOM イベント）
       ↓
  AppController
  ├── beginWork()     → TimerEngine.start() + ProjectManager.getAll() + DailyAccumulator.checkAndRollover()
  ├── switchProject() → TimerEngine.checkpoint() → DailyAccumulator.add() → TimerEngine.start()
  ├── endWork()       → TimerEngine.stop() → DailyAccumulator.add() → DailyAccumulator.saveToday()
  └── updateDisplay() → TimerEngine.getElapsedSeconds() + DailyAccumulator.getAllTodayAccumulated()
         ↓（DOM 更新）
      各プロジェクトボタンの経過時間・累積時間表示を更新
```
