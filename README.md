# mov-to-pdf

画面操作の録画（mov / mp4 など）から、**操作マニュアル（Markdown）**・**画面キャプチャ**・**処理フロー図（Mermaid → PNG）**・**PDF（Chrome + puppeteer-core）**までを一気通貫で扱うための **エージェント向け手順（Skill）とテンプレート**をまとめたリポジトリです。

リポジトリ: [https://github.com/rossoandoy/mov-to-pdf](https://github.com/rossoandoy/mov-to-pdf)

---

## できること

- 長い録画を ffmpeg でフレーム化し、時系列で画面を読み取って手順を書く
- `operation_manual.md` と `./images/` 以下のキャプチャを PDF にまとめる
- Mermaid はそのまま PDF に貼ると崩れやすいため、**CLI で PNG 化してから**埋め込む

---

## どの AI・エディタで使えるか

| 使い方 | 説明 |
|--------|------|
| **Cursor** | `SKILL.md` を Agent Skills 用のスキルディレクトリに置く（例: `~/.cursor/skills/video-to-manual-pdf/SKILL.md`）。チャットから「録画からマニュアル PDF を」と依頼すると、手順に沿って実行しやすい。 |
| **Claude Code / Claude Desktop** | 同じく `SKILL.md` をプロジェクトの `.claude/skills/` 等に置くか、内容をルールにコピーする。フロントマター（YAML）は各製品の Skill 形式に合わせて調整してよい。 |
| **その他（ChatGPT・Gemini CLI 等）** | リポジトリを clone するか `SKILL.md` を開き、**この Markdown をコンテキストとして参照**させればよい。必須は **ffmpeg・Node.js・Chrome が動くマシン**と、ターミナルコマンドを実行できること。 |

つまり **特定ベンダー専用ではなく**、「手順書 + テンプレート」として誰でも再利用できます。

---

## PDF の上書き方針（重要）

- **別トピックのマニュアルを増やすときは、入出力ファイルを分ける**ことを推奨します（例: `Manabie_退会.md` → `Manabie_退会.pdf`）。既定の `operation_manual.pdf` だけを何度も `npm run build` すると、**同じ名前の PDF を上書き**します。
- **エージェント向け**: 既存の共有 PDF を上書きしそうなときは、**ユーザーに確認してから**実行してよい（「`operation_manual.pdf` を再生成してよいですか？」など）。
- **テンプレートの `build-pdf.mjs`**: 既定では既存 PDF があると **警告を出してから上書き**します。誤上書きを防ぎたい環境では `MANUAL_PDF_STRICT_OVERWRITE=1` を付けると、既存ファイルがある場合は **中止**し、意図した上書きだけ `--force` で行えます。詳細は [SKILL.md の Step E](SKILL.md) と [reference.md](reference.md) を参照してください。

---

## リポジトリの内容

| パス | 説明 |
|------|------|
| [SKILL.md](SKILL.md) | エージェント向けの詳細手順（抽出 → 解析 → Markdown → 図 → PDF） |
| [reference.md](reference.md) | ffmpeg / npm のコマンド早見・チェックリスト |
| [templates/](templates/) | 作業フォルダにコピーして使う `build-pdf.mjs`・`package.json`・フロー図のひな型 |

---

## クイックスタート

1. 任意の作業フォルダ（例: プロジェクトの `manual/`）に **`templates/` の中身をコピー**する。
2. `operation_manual.md` とキャプチャ用の `images/` を用意する。
3. 必要なら `diagrams/process_flow.mmd` を編集する。
4. 依存関係を入れてビルドする。

```bash
cd manual   # 作業ディレクトリ
npm install
npm run build
```

生成物の例:

- `images/process_flow.png`（Mermaid から出力）
- `operation_manual.pdf`

**複数マニュアルがある場合**は、`node build-pdf.mjs 別件.md 別件.pdf` や `package.json` の用途別 `npm run build:xxx` で **出力 PDF 名を分ける**運用を推奨します。

---

## 必要な環境

- **ffmpeg**（録画から静止画を切り出す）
- **Node.js** と **npm**（PDF 生成・Mermaid CLI）
- **Google Chrome** または **Chromium**（`build-pdf.mjs` が `puppeteer-core` で印刷 PDF 化）。見つからない場合は環境変数 `CHROME_PATH` に実行ファイルのフルパスを指定。

---

## 配布・公開前のチェック

- `SKILL.md` の frontmatter（`name` / `description`）が意図どおりか
- `templates/package.json` の依存が手元で実行確認済みか
- `reference.md` のコマンドが現行手順と一致しているか
- サンプル画像・本文に **個人情報や社内秘密が含まれていないか**

---

## ライセンス

利用条件はリポジトリ利用者の方針に従ってください。未指定の場合は、利用前に作者へ確認することを推奨します。
