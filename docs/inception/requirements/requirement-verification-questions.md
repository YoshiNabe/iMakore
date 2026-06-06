# iMakore (イマコレ) — 要件確認質問

iMakore アプリの開発を開始するにあたり、以下の質問に答えてください。
各質問の `[Answer]:` タグの後に回答の英字を入力してください。
いずれの選択肢にも当てはまらない場合は最後の選択肢 (X/D 等の「その他」) を選び、[Answer]: タグの後に説明を追記してください。

---

## Question 1
フロントエンド技術スタックとして何を使用しますか？（GitHub Pages へのデプロイに対応する必要があります）

A) バニラ HTML/CSS/JavaScript（フレームワーク・ビルドツール不使用。依存ゼロでシンプル。GitHub Pages に直接配置可能）
B) React（Vite 使用。ビルドステップあり。コンポーネント設計が得意）
C) Vue.js（Vite 使用。ビルドステップあり。学習コストが低い）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
GitHub リポジトリ名として何を使用しますか？
（GitHub Pages の URL は `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` になります）

A) imakore（英字小文字、シンプル）
B) iMakore（アプリ名と一致するキャメルケース）
C) imakore-app
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3
カレンダー連携は、どのような形式で実現しますか？

A) アプリ内に独自のカレンダービューを内蔵する（外部サービス不使用。オフライン対応。過去の日別集計を月カレンダー形式で表示）
B) Google カレンダーと連携する（Google API 使用、OAuth 認証が必要。予定として記録）
C) iCalendar 形式 (.ics ファイル) でエクスポートし、任意の外部カレンダーにインポートできるようにする
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
始業・終業の管理はどうしますか？（「いずれかのボタンが必ず押されている状態」の初期状態に関係します）

A) 「休憩 / 作業外」専用ボタンを設ける。このボタンが押されている間は「非稼働時間」として記録される。アプリ起動時はこのボタンがデフォルトでアクティブ
B) 「始業」ボタンを別途設ける。始業ボタンを押してプロジェクトボタンに切り替え、終業ボタンで全ての記録を停止する（終業後はどのボタンもアクティブでなくなる）
C) 最後に押したプロジェクトボタンが常にアクティブ。アプリ起動時は前回終了時のボタンが復元される
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
累積時間の表示と集計のリセットタイミングを教えてください。

A) 日次リセット（毎日 0 時にその日の累積をリセット）+ 過去の日次データはカレンダーで参照可能
B) 手動リセットのみ（明示的にリセット操作をしない限り累積し続ける）
C) セッション管理（「始業」から「終業」まで 1 セッション。セッション単位の集計をカレンダーに記録）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
プロジェクトコード（任意入力）の主な用途は何ですか？

A) ボタンに短縮コードを表示するため（プロジェクト名が長い場合の省略表示）
B) 外部システムとの連携（請求書・工数管理システムへのデータエクスポート時に使用）
C) 社内プロジェクト管理コード（既存の命名規則・プロジェクト番号に合わせる）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7: Visual Enhancement Extension
本プロジェクトで Visual Enhancement（functional-design 成果物への Mermaid 図埋め込み）ルールを強制適用しますか？

A) はい — 全 VISUAL ルールを blocking 制約として強制する（推奨。テキスト中心の AI-DLC 成果物を erDiagram / sequenceDiagram / stateDiagram で補強する）
B) いいえ — VISUAL ルールを全てスキップ（成果物はテキストのみ）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8: External UI Spec Extension
本プロジェクトで External UI Spec（機能ごとのディレクトリに画面仕様 + モックアップを格納する）ルールを強制適用しますか？

A) はい — UI ルールを強制する。`docs/specs/<feature>/` 以下に画面ごとの markdown（画面要素 / 入力 validation / 画面遷移）を生成し、`ui-flow.md` に画面遷移を記載する
B) いいえ — UI ルールをスキップ（AI-DLC ネイティブのデフォルト動作）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 9: Security Baseline Extension
セキュリティ拡張ルールを強制適用しますか？（ローカルストレージへのデータ保存・GitHub Pages での公開・XSS 対策等を考慮）

A) はい — 全 SECURITY ルールを blocking 制約として強制する（本番グレードのアプリに推奨）
B) いいえ — SECURITY ルールをスキップ（PoC・プロトタイプ向け）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 10: Property-Based Testing Extension
プロパティベーステストルールを強制適用しますか？（時間計算・集計ロジック等のビジネスロジックに特に有効）

A) はい — 全 PBT ルールを blocking 制約として強制する（時間計算・日次集計ロジックに推奨）
B) 部分適用 — 純粋関数とシリアライゼーションのみに適用
C) いいえ — PBT ルールをスキップ
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 11: Step Process Extension
Step Process（Construction Code Generation を Foundation Step + Story Step の 2-tier で回す方式。1 Step = 1 PR = 小さな atomic な開発サイクル）を強制適用しますか？

A) はい — 全 STEP ルールを強制する（各ユニットを Foundation tier + Story tier に分解し、1 Step = 1 PR で進める）
B) いいえ — STEP ルールをスキップ（AI-DLC ネイティブの Unit 単位 Code Generation を維持）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

*すべての質問に回答したら「完了しました」とお知らせください。*
