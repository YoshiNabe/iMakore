# iMakore U1-core — NFR Requirements Plan

## 実行ステップ（チェックボックス）

- [x] Q1〜Q3 の確認（C/A/A）
- [x] NFR 要件定義 (nfr-requirements.md)
- [x] 技術スタック決定記録 (tech-stack-decisions.md)
- [x] 整合性の検証

---

## 分析サマリー（既定事項）

Functional Design の分析から、以下は既に決定済みのため質問不要。

| NFR 領域 | 評価 | 根拠 |
|---|---|---|
| スケーラビリティ | 単一ユーザー、スケール不要 | 個人利用の自己管理ツール |
| 可用性 | GitHub Pages の CDN 稼働率に依存（≥99.9%）| サーバーなし |
| セキュリティ | 最小限（Security Baseline 無効、プロトタイプレベル）| ユーザー選択済み |
| 技術スタック | バニラ HTML/CSS/JS + ES Modules | ユーザー選択済み |

以下 3 点のみ確認が必要。

---

## 確認質問

### Question 1: localStorage データ保持期間
日次累積データ（`imakore_daily`）は端末の localStorage に無制限に蓄積されます。
1 プロジェクト × 1 日 ≒ 50 バイト程度。100 プロジェクト × 365 日 ≒ 約 1.8 MB/年。
localStorage の上限（通常 5 MB）を考慮した保持ポリシーを選択してください。

A) **無制限保持** — 明示的な削除操作がない限り永久に保持する。ユーザーが手動でクリア可能な設定を設ける
B) **直近 1 年間のみ保持** — 起動時に 1 年より古いデータを自動削除する
C) **直近 2 年間のみ保持** — 起動時に 2 年より古いデータを自動削除する
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2: 対応ブラウザ
ES Modules と `crypto.randomUUID()` を使用するため、対応ブラウザの範囲を決定する必要があります。

A) **モダンブラウザのみ**（Chrome 92+・Firefox 90+・Safari 15.4+・Edge 92+）— ES Modules・`crypto.randomUUID()` が標準対応。IE・旧バージョンは非対応
B) **やや広い範囲**（Chrome 61+・Firefox 60+・Safari 11+）— ES Modules は対応。`crypto.randomUUID()` は polyfill で対応
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3: バックグラウンドタブ / ページ非表示時の動作
別のアプリを操作中など、iMakore のタブが非表示（バックグラウンド）になった場合、`setInterval(1000)` の処理をどうしますか？

A) **setInterval を一時停止する**（Page Visibility API 使用）— タブが非表示の間は DOM 更新をスキップし、タブが再表示されたとき `Date.now()` で正確な時間に一括更新する。バッテリー・CPU 消費を抑える
B) **setInterval をそのまま継続する** — タブが非表示でも毎秒処理し続ける。実装がシンプル。現代ブラウザは非表示タブの `setInterval` を自動的に間引く（≒1 秒精度は維持）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

*すべての質問に回答したら「完了しました」とお知らせください。*
