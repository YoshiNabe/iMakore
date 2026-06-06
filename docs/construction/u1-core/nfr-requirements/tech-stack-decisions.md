# iMakore U1-core — 技術スタック決定記録

## 採用技術一覧

| 技術 / API | 採用内容 | 決定理由 |
|---|---|---|
| マークアップ | HTML5 | 標準。ビルドツール不要でそのまま GitHub Pages に配置できる |
| スタイリング | CSS3（フレームワークなし）| 外部依存なし、オフライン対応 |
| スクリプト | バニラ JavaScript（ES2020+）| フレームワーク・ビルドツール不使用。ユーザー選択 |
| モジュール方式 | ES Modules (`<script type="module">`) | ビルドなしでファイル分割可能。モダンブラウザ標準対応 |
| データ永続化 | Web Storage API (`localStorage`) | オフライン、サーバー不要、シンプルな同期 API |
| ID 生成 | `crypto.randomUUID()` | ブラウザ内蔵。外部ライブラリ不要 |
| タイマー表示 | `setInterval(1000)` + `Date.now()` 差分 | `setInterval` で UI 更新周期を制御し、時刻計算は `Date.now()` で精度を保証 |
| バックグラウンド最適化 | Page Visibility API (`visibilitychange`)| タブ非表示中は setInterval を停止し CPU / バッテリーを節約 |
| ホスティング | GitHub Pages | 静的ファイル配信、CDN、無料、ソースコード管理と一体 |

---

## 採用しない技術と理由

| 技術 | 不採用理由 |
|---|---|
| React / Vue / Angular 等のフレームワーク | ビルドステップが必要。GitHub Pages への直接配置が複雑になる。ユーザーがシンプルさを優先 |
| TypeScript | ビルドステップが必要。バニラ JS の型コメント（JSDoc）で代替 |
| IndexedDB | localStorage で十分な容量（2 年 ≒ 3.6 MB）。API がより複雑 |
| Service Worker / PWA | 追加の複雑さに対し、localhost ベースのオフライン動作で要件を満たせる |
| `setInterval` 単体での時刻管理 | スリープ復帰・タブスロットリングでドリフトが発生する。`Date.now()` 差分で補完必須 |
| polyfill（`crypto.randomUUID()` 等）| モダンブラウザ限定（NFR-B-01）とすることで不要 |

---

## ブラウザ対応マトリクス

| 機能 | Chrome 92+ | Firefox 95+ | Safari 15.4+ | Edge 92+ |
|---|---|---|---|---|
| ES Modules | ✅ | ✅ | ✅ | ✅ |
| `crypto.randomUUID()` | ✅ | ✅ | ✅ | ✅ |
| `localStorage` | ✅ | ✅ | ✅ | ✅ |
| Page Visibility API | ✅ | ✅ | ✅ | ✅ |
| CSS Grid / Flexbox | ✅ | ✅ | ✅ | ✅ |
