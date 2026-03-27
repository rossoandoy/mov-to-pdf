---
name: video-to-manual-pdf
description: >-
  Converts large system screen-recording videos (mov/mp4) into a user-facing
  operation manual: extracts frames with ffmpeg, analyzes screenshots in time
  order, writes Markdown (operation_manual.md) with embedded captures under
  ./images/, renders a process flow diagram from Mermaid to PNG for PDF
  compatibility, and prints operation_manual.pdf using Google Chrome via
  puppeteer-core (see templates/). Use when the user asks for manuals from
  screen recordings, operation videos, ffmpeg frame extraction, screenshot
  manuals, operation_manual.pdf, 画面録画, 操作動画, マニュアル自動生成, or
  スクショ付きマニュアル.
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

## Step D — 処理ステップ図（PDF 用に PNG）

多くの PDF 変換では **Mermaid のコードブロックが図にならない**。次を推奨する。

1. フロー図のソースを `diagrams/process_flow.mmd` に保存する（Mermaid `flowchart` 等）。
2. `@mermaid-js/mermaid-cli`（`mmdc`）で PNG を生成し、`images/process_flow.png` に出力する。
3. `operation_manual.md` では **`![処理ステップ図](./images/process_flow.png)`** で参照する。

テンプレートは `templates/` を作業ディレクトリにコピーして使える。

## Step E — PDF 出力

1. 作業ディレクトリに `package.json`・`build-pdf.mjs` を置く（このスキルの `templates/` をコピー）。
2. `npm install` のあと `npm run build`（`diagram` → `pdf`）または `npm run pdf` のみ。
3. 成果物 **`operation_manual.pdf`** を確認する。

**注意**: `md-to-pdf` 等のみに依存すると Chromium のダウンロードに時間がかかることがある。**既存 Chrome + puppeteer-core**（テンプレート方式）をデフォルトとする。

## クリーンアップ

- 解析用の **`frames/`** は作業完了後に削除してよい（リポジトリにコミットしない運用が一般的）。
- **`node_modules`** は `.gitignore` に含める。

## 品質チェック

- 手順の飛躍がないか  
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
