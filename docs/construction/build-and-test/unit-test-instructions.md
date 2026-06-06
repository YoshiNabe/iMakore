# iMakore — ユニットテスト実行手順

## テスト対象

部分適用 PBT（純粋関数・シリアライゼーション）として以下をテストする。

| テストファイル | テスト対象 | テスト種別 |
|---|---|---|
| `tests/utils.test.js` | `formatTime` / `formatTimeCompact` / `formatDate` / `getToday` | 境界値テスト |
| `tests/storage.test.js` | localStorage シリアライズ ラウンドトリップ | 統合テスト（jsdom）|
| `tests/accumulator.test.js` | ロールオーバー検知ロジック / 深夜計算 / 日付文字列比較 | 純粋関数テスト |

---

## 実行手順

### 1. 依存パッケージのインストール

```bash
cd C:\Users\y_watanabe\imakore
npm install
```

### 2. 全テストの実行

```bash
npm test
```

**期待される出力:**

```
✓ tests/utils.test.js (12 tests)
✓ tests/storage.test.js (9 tests)
✓ tests/accumulator.test.js (8 tests)

Test Files  3 passed (3)
Tests       29 passed (29)
Duration    ~1s
```

### 3. カバレッジ計測（任意）

```bash
npm run test:coverage
```

### 4. 失敗時の対応

1. エラーメッセージのスタックトレースを確認する
2. 対応するソースファイルを修正する
3. `npm test` を再実行してすべて PASS になることを確認する

---

## テストケース一覧

### utils.test.js（12 テスト）

| テスト | 入力 | 期待値 |
|---|---|---|
| formatTime: 0 秒 | 0 | `'00:00:00'` |
| formatTime: 59 秒 | 59 | `'00:00:59'` |
| formatTime: 60 秒 | 60 | `'00:01:00'` |
| formatTime: 3600 秒 | 3600 | `'01:00:00'` |
| formatTime: 36000 秒 | 36000 | `'10:00:00'` |
| formatTime: 負の値 | -5 | `'00:00:00'` |
| formatTime: 小数 | 1.9 | `'00:00:01'` |
| formatTimeCompact: 0 | 0 | `'0:00'` |
| formatTimeCompact: 3600 | 3600 | `'1:00'` |
| formatDate: 2026-06-06 | new Date(2026,5,6) | `'2026-06-06'` |
| formatDate: ゼロパディング | new Date(2026,0,1) | `'2026-01-01'` |
| getToday: 今日 | — | YYYY-MM-DD 形式 |

### storage.test.js（9 テスト）

- プロジェクト一覧の保存・復元
- null code の保持
- 日次記録の保存・復元
- 複数日付の独立性
- SessionSnapshot の保存・復元・クリア
- 削除済みプロジェクトの登録・検索

### accumulator.test.js（8 テスト）

- 同一日: rollover 不要
- 異なる日: rollover 必要
- 複数日ギャップ: rollover 必要
- 年またぎ: rollover 必要
- 深夜 1 時間前に開始 → 3600 秒
- 深夜ちょうどに開始 → 0 秒
- 将来タイムスタンプ → 0 秒（非負）
- 日付文字列の辞書順比較正確性
