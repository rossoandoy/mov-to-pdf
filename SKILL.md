---
name: video-to-manual-pdf
description: >-
  Converts large system screen-recording videos (mov/mp4) into a user-facing
  operation manual: extracts frames with ffmpeg, analyzes screenshots in time
  order, writes Markdown (operation_manual.md) with embedded captures under
  ./images/, renders a process flow diagram from Mermaid to PNG for PDF
  compatibility, and prints operation_manual.pdf using Google Chrome via
  puppeteer-core (see templates/). Prefer separate Markdown/PDF filenames per
  topic to avoid overwriting existing PDFs; confirm with the user before
  overwriting shared outputs. Use when the user asks for manuals from screen
  recordings, operation videos, ffmpeg frame extraction, screenshot manuals,
  operation_manual.pdf, 画面録画, 操作動画, マニュアル自動生成, or スクショ付きマニュアル.
---

# 動画からマニュアル PDF 生成（エージェント手順）

大容量の画面操作動画はそのままでは解析できない。**ffmpeg でフレーム抽出 → 画像を時系列で読む → Markdown 作成 → キャプチャを `./images/` に配置 → 処理ステップ図を PNG 化 → Chrome で PDF 出力**の順で進める。

## 前提ツール

- **ffmpeg**（`ffprobe` が無くても `ffmpeg -i "path/to/video"` でメタデータ取得可）
- **Node.js** と **npm**（PDF・Mermaid PNG 用）
- **PDF 出力**: ローカルの **Google Chrome**（または Chromium）。テンプレートの `build-pdf.mjs` 内 `chromeCandidates` に OS に合わせてパスを追加してよい。

## 作業ディレクトリと入力

- ユーザーが指定したフォルダ、またはプロジェクト内の `manual/` など一箇所に成果物をまとめる。
- 動画パスに **スペース** が含まれる場合はシェルで **必ずクォート**する。

## Step A — フレーム抽出（前処理）

1. 一時ディレクトリ `frames/` を作成する。
2. 例（間隔は動画に合わせ 2〜5 秒に相当する `fps` で調整。幅 1080px 前後にリサイズ）:

   ```bash
   ffmpeg -y -i "INPUT.mov" -vf "fps=1/3,scale=1080:-2" -q:v 3 "frames/frame_%03d.jpg"
   ```

3. 抽出枚数が多い場合はバッチ（数枚〜十数枚単位）で画像を読み、トークンを抑える。

## Step B — 画像解析

`frames/` 内を **ファイル名順（時系列）** で読み、次を整理する。

- どのアプリ／画面か（可能ならラベル名）
- カーソル・クリック・入力の目安
- 画面遷移の前後差分
- エラー・警告の有無

## Step C — Markdown（`operation_manual.md`）

次の **必須構成** で書く（日本語ユーザー向けが一般的）。

1. タイトル  
2. はじめに（目的）  
3. 前提条件  
4. 操作手順（番号付き。クリック・入力など具体表現。注意・ヒント）  
5. 完了時の状態  

各手順の直下に、対応するキャプチャを **Markdown 画像** で埋め込む。

```markdown
![説明文](./images/step01_example.jpg)
```

- **`./images/`** プレフィックスを付け、エディタのプレビューと PDF の両方で相対解決しやすくする。
- 本文に `![]()` が無いと画像は表示されない（キャプション文字だけ残すミスに注意）。

### フローが途切れやすい箇所（問合せ〜申請系で特に重要）

録画が省略気味でも、**ユーザーが次に何をすべきか**が一本線になるよう、次を手順と **Mermaid 図の両方** に反映する（詳細度は「手順ごとに 1 キャプチャ＋短文」の粒度を目安にする。過剰な一文説明は避ける）。

- **重要操作直後の通知**: 変換・申請提出などのあと、画面上部の **通知（ベル）** を開き、対象の **お問合せ番号** や **新規の見込み顧客追加** などの文言を確認する。**お問合せレコードを開いたまま** と **ホームに戻ってから** のどちらでも起こり得る場合は、**両方のスクショを 1 手順内に並べる**か、短い分岐見出しで済ませる。
- **ホーム／タブの明示**: **ホーム** タブへ戻る、アプリランチャーで別アプリへ切り替える等、**どのナビゲーションで次の画面に入ったか**を一文入れる（録画が飛んでいても補完する）。
- **ダッシュボード上のメニュー**: ホームの **問合せ管理** ブロックから **問合せステータス管理** を開く、など **一覧・管理画面は別 URL である** 手順を入れる。画面表記は **`問合せステータス管理`** が多いが、口頭では「お問合せステータス管理」と呼ぶことがある。**キャプションと本文は画面の文字に合わせ**、前提条件で呼び方の差を 1 行注記してよい。
- **一覧→レコードの再接続**: ステータス管理のあと、**問合せ一覧**・**通知のリンク**・**検索** のいずれかで対象 **お問合せ** を再オープンし、**入会状況** から **Application（商談 Stage 管理）** を開く、までを **一続きの手順** に書く（ここが抜けると「変換したのに次が Kanban だけ」になりがち）。
- **`diagrams/process_flow.mmd`**: 上記の **通知確認・ホーム・問合せステータス管理・対象お問合せを再オープン** を中間ノードとして含め、本文の番号順と整合させる。

## Step D — 処理ステップ図（PDF 用に PNG）

多くの PDF 変換では **Mermaid のコードブロックが図にならない**。次を推奨する。

1. フロー図のソースを `diagrams/process_flow.mmd` に保存する（Mermaid `flowchart` 等）。
2. `@mermaid-js/mermaid-cli`（`mmdc`）で PNG を生成し、`images/process_flow.png` に出力する。
3. `operation_manual.md` では **`![処理ステップ図](./images/process_flow.png)`** で参照する。

テンプレートは `templates/` を作業ディレクトリにコピーして使える。

## Step E — PDF 出力（既存 PDF の上書きに注意）

1. 作業ディレクトリに `package.json`・`build-pdf.mjs` を置く（このスキルの `templates/` をコピー）。
2. `npm install` のあと、用途に応じてビルドする。
   - **既定（1 本だけのマニュアル）**: `npm run build`（`diagram` → `pdf`）または `npm run pdf` のみ → `operation_manual.md` → **`operation_manual.pdf`**。
   - **複数マニュアルがある場合（推奨）**: **`operation_manual.pdf` や他トピックの PDF を誤って上書きしない**よう、次のいずれかを徹底する。
     - **入出力を分ける**: `node build-pdf.mjs <入力.md> <出力.pdf>` で **トピックごとに別名の PDF** を出す。
     - **`package.json` に用途別スクリプト** を用意し、コマンドからファイル名が一目でわかるようにする（例: `npm run build:withdrawal` → `Manabie_退会.md` → `Manabie_退会.pdf`）。
     - **Mermaid も** `diagrams/Topic_flow.mmd`・`images/Topic_flow.png` のように **トピック単位でファイルを分ける**。
3. **エージェントの判断**: 既存の `*.pdf` を上書きしそうな操作の前に、**ユーザーへ一言確認してよい**（「`operation_manual.pdf` を再生成してよいですか？」「別名 `Topic.pdf` で出しますか？」など）。CI や厳格運用では、テンプレートの `build-pdf.mjs` が **`MANUAL_PDF_STRICT_OVERWRITE=1`** のとき既存 PDF があると中止し、**`--force`** でだけ上書きする動きになっている。
4. 成果物の PDF パスをユーザーに返す。

**注意**: `md-to-pdf` 等のみに依存すると Chromium のダウンロードに時間がかかることがある。**既存 Chrome + puppeteer-core**（テンプレート方式）をデフォルトとする。

### 他の AI / エディタでも使えるか

この `SKILL.md` は **Markdown の手順書**である。**Cursor の Agent Skill** として置けるほか、**Claude Code の Skill**、**自作のプロジェクトルール**、またはチャットに **ファイルを貼り付け／リポジトリを参照**させる形でも、内容に従って同じパイプラインを実行できる。必須は **ffmpeg・Node・Chrome が利用可能な環境**と、エージェントがシェルコマンドを実行できることである（ツール名は製品ごとに異なる）。

## クリーンアップ

- 解析用の **`frames/`** は作業完了後に削除してよい（リポジトリにコミットしない運用が一般的）。
- **`node_modules`** は `.gitignore` に含める。

## 品質チェック

- 手順の飛躍がないか（**通知・ホーム・一覧画面・タブ切替** など、録画で一瞬のものが抜けていないか）  
- 本文と **抽出画像の内容が矛盾しないか**  
- 個人情報・社内番号がそのまま載る場合はマスクや一般化をユーザーに確認する  

## 同梱テンプレート

| パス | 内容 |
|------|------|
| [templates/package.json](templates/package.json) | `diagram` / `pdf` / `build` |
| [templates/build-pdf.mjs](templates/build-pdf.mjs) | `operation_manual.md` → PDF |
| [templates/diagrams/process_flow.mmd](templates/diagrams/process_flow.mmd) | フロー図のひな型 |
| [reference.md](reference.md) | ffmpeg 例・チェックリスト |

新規案件では `templates/` をプロジェクトの `manual/` にコピーし、動画・本文に合わせて編集する。
