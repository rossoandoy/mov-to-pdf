# mov-to-pdf

画面操作の録画（mov / mp4 など）から、**操作マニュアル（Markdown）**・**画面キャプチャ**・**処理フロー図（Mermaid → PNG）**・**PDF（Chrome + puppeteer-core）**までを一気通貫で扱うための **エージェント向け手順（Skill）とテンプレート**をまとめたリポジトリです。

**公式リポジトリ:** [https://github.com/rossoandoy/mov-to-pdf](https://github.com/rossoandoy/mov-to-pdf)

---

## このリポジトリの位置づけ

| 要素 | 説明 |
|------|------|
| **Skill（[SKILL.md](SKILL.md)）** | AI や人間が従う **手順書**（Markdown）。フレーム抽出から PDF までの段階（Step A〜E）、**キャプチャ品質（Step A'）**、**PDF・キャプチャの品質チェック**が書かれている。ベンダー専用の実行ファイルは含まない。 |
| **テンプレート（[templates/](templates/)）** | 実プロジェクトの作業フォルダに **コピーして使う** ビルド用ファイル群。`build-pdf.mjs`・`package.json`・Mermaid ひな型など。 |
| **リファレンス（[reference.md](reference.md)）** | ffmpeg / npm のコマンド早見とチェックリスト。 |

「Skill」は各 AI 製品の **Skills ディレクトリに置けるドキュメント**としても、**単なるプロジェクト内 Markdown** としても利用できる。製品ごとに frontmatter（YAML）の書式だけ合わせればよい。

---

## 前提条件

### 実行環境（必須）

次が **ローカルマシン（または CI ランナー）上**で利用可能であること。ブラウザ版チャットのみでは ffmpeg / npm を実行できない場合がある。

| 要件 | 内容 |
|------|------|
| **OS** | macOS / Windows / Linux（パス区切り・Chrome の場所は OS 依存） |
| **ffmpeg** | 動画から静止画フレームを抽出する。`ffprobe` が無くても `ffmpeg -i` で長さ・ストリーム確認は可能。 |
| **Node.js** | **LTS 推奨**。`npm` で依存パッケージを入れる。 |
| **Chrome または Chromium** | PDF は **ヘッドレス Chrome** で HTML を印刷する方式（`puppeteer-core`）。既定パスに無い場合は **`CHROME_PATH`** で実行ファイルを指定。 |
| **シェル** | 動画パスにスペースが含まれる場合は **クォート**が必要。 |

### 入力・成果物の前提

- **入力:** 画面録画ファイル（mov / mp4 等）。長時間はフレーム間隔を広げてトークンと枚数を抑える（[SKILL.md](SKILL.md) Step A 参照）。
- **成果物の置き場:** `manual/` など **一つの作業ディレクトリ**に、Markdown・`images/`・`diagrams/`・PDF をまとめる想定。
- **AI の利用:** 必須ではない。人間が [SKILL.md](SKILL.md) に従って手作業でもよい。AI を使う場合は **画像の内容把握・本文草案・Mermaid 草案**に向く。

---

## 技術要素（スタック）

| 区分 | 技術 | 役割 |
|------|------|------|
| 動画処理 | **ffmpeg** | 可変フレームレートで JPG 等へ書き出し、解像度を `scale` で抑制。 |
| マークダウン | **marked** | `build-pdf.mjs` が `.md` を **HTML 断片**に変換。 |
| PDF 生成 | **puppeteer-core** + **Chrome** | 一時 HTML を開き **`page.pdf()`** で A4 PDF 出力（埋め込み画像は相対パスで解決）。 |
| 図 | **@mermaid-js/mermaid-cli**（`mmdc`） | Mermaid ソースを **PNG にレンダリング**（多くの PDF パイプラインでは Mermaid のコードブロックだけでは図にならないため）。 |

依存バージョンは [templates/package.json](templates/package.json) を参照。

---

## アーキテクチャ

データの流れは **「録画 → ラスタ画像 → テキスト・構成（Markdown）→ 図（PNG）→ 印刷用 HTML → PDF」** である。LLM は **Step B（画像の意味整理）と Step C（文書化）**に挟まれる任意層として置ける。

```mermaid
flowchart LR
  subgraph ingest["取り込み"]
    V[動画 mov/mp4]
    F[ffmpeg]
    J[フレーム画像 frames/]
    V --> F --> J
  end
  subgraph content["文書・図"]
    J --> B[画像の整理・手順化]
    B --> MD[Markdown + images/]
    MMD[diagrams/*.mmd] --> mmdc[mmdc]
    mmdc --> PNG[images/*.png]
    MD --> MD
    PNG --> MD
  end
  subgraph pdfout["PDF"]
    MD --> marked[marked]
    marked --> HTML[一時 HTML]
    HTML --> chrome[Chrome ヘッドレス]
    chrome --> PDF[*.pdf]
  end
```

- **単一パイプライン:** 既定では `operation_manual.md` → 一時 `_pdf_temp_*.html` → `operation_manual.pdf`（[templates/build-pdf.mjs](templates/build-pdf.mjs)）。
- **複数マニュアル:** 入出力ファイル名を引数で変える、または `package.json` に用途別 `build:*` を定義して **別 PDF を並行管理**する（上書き方針は後述）。

---

## 処理内容（パイプライン概要）

[SKILL.md](SKILL.md) の Step A〜E に対応する処理の要約である。

| 段階 | 内容 |
|------|------|
| **Step A** | 一時ディレクトリにフレームを抽出（`fps` で間隔調整、必要なら解像度を下げる）。 |
| **Step B** | フレームを **時系列**で読み、画面遷移・操作・エラー有無を整理する（人間またはマルチモーダル LLM）。 |
| **Step C** | `operation_manual.md`（またはトピック別 `.md`）を執筆。各手順に `./images/` のキャプチャを埋め込む。 |
| **Step D** | `diagrams/*.mmd` を `mmdc` で PNG 化し、本文から `![図](./images/....png)` で参照。 |
| **Step E** | `build-pdf.mjs` が Markdown→HTML→PDF。複数トピック時は **入出力パスを分離**し、既存 PDF の誤上書きに注意（`MANUAL_PDF_STRICT_OVERWRITE`・`--force` は [reference.md](reference.md)）。 |

クリーンアップとして、解析用 **`frames/`** は作業後に削除してよい（リポジトリにコミットしない運用が一般的）。

---

## リポジトリに含まれるもの

| パス | 役割 |
|------|------|
| [SKILL.md](SKILL.md) | **メイン手順書**（Step A〜E の詳細・品質チェック・PDF 上書き時の注意）。 |
| [reference.md](reference.md) | コマンド早見・チェックリスト。 |
| [templates/](templates/) | 作業フォルダへコピーする **`build-pdf.mjs`**・**`package.json`**・フロー図のひな型。 |

---

## 各種 AI ツールでの利用開始ガイド

### 1. Cursor（推奨：ターミナル連携がしやすい）

1. 本リポジトリを clone するか、[SKILL.md](SKILL.md) を取得する。
2. Cursor の Agent Skills 用ディレクトリに配置する（例: `~/.cursor/skills/video-to-manual-pdf/SKILL.md`）。プロジェクト直下の `.cursor/rules` に要約を置く方法でもよい。
3. 作業用フォルダ（例: `manual/`）に [templates/](templates/) をコピーし、`npm install` 済みにしておく。
4. チャットで「`mov-to-pdf` の SKILL に従って、`○○.mov` からマニュアル PDF を作って」と依頼する。

**活用のコツ:** 動画パスと成果物の出力先（フォルダ）を最初のメッセージで明示すると迷いが減ります。

---

### 2. Claude Code / Claude Desktop

1. リポジトリを clone するか、`SKILL.md` をプロジェクトにコピーする（例: `docs/skills/mov-to-pdf/SKILL.md`）。
2. Anthropic 公表の **プロジェクト設定（Skills / CLAUDE.md 等）** に従い、**Skills** や **CLAUDE.md** に「録画マニュアル作成は `docs/skills/.../SKILL.md` に従う」と一文入れておくと毎回の説明が省けます。
3. frontmatter（YAML）は、Claude Code の Skill 形式に合わせて **名前や description だけ調整**してよい。

**活用のコツ:** 長い `SKILL.md` を毎回読ませるより、**「Step A〜E の一行要約」** を `CLAUDE.md` に書き、詳細はファイル参照にするとトークンを節約できます。

---

### 3. GitHub Copilot（VS Code / JetBrains）

1. リポジトリをワークスペースに開く。
2. **Custom instructions** または **プロンプト用メモ**に、[SKILL.md](SKILL.md) の「Step A〜E」の見出しと [reference.md](reference.md) の ffmpeg 例を貼る。
3. Copilot Chat で「この手順で `manual/` の PDF を更新して」と依頼する。

**活用のコツ:** `SKILL.md` をリポジトリにコミットしておくと `@workspace` 参照がしやすくなります。

---

### 4. ChatGPT / Google Gemini（Web）

1. [SKILL.md](SKILL.md) の必要なセクションをコピーするか、ファイルをアップロードできるプランで添付する。
2. 「この手順に従い、抽出したフレームの説明から Markdown 案を書いて」と依頼する。

**制約:** ブラウザ版だけでは **ffmpeg・npm を実行できない**ことが多い。**AI:** フレームの説明・Markdown・Mermaid 草案。**人間（または Cursor 等）:** ffmpeg、`npm run build`、PDF 生成。

---

### 5. その他（Gemini CLI、ローカル LLM 等）

- `SKILL.md` は **プレーンな Markdown** のため、クライアントを問わず参照可能。
- ローカル LLM は **Step を細かい単位で依頼**すると追従しやすい。

---

## 活用ガイドライン（共通）

1. **環境を先に揃える:** 上記 [前提条件](#前提条件実行環境必須) を満たす。
2. **作業ディレクトリを一箇所に決める:** 例として `manual/` に `templates/` を展開し、動画・画像・Markdown・PDF をまとめる。
3. **複数トピックのマニュアル:** 入出力ファイル名を分ける（例: `TopicA.md` → `TopicA.pdf`）。既定の `operation_manual.pdf` を繰り返しビルドすると **上書き**される。詳細は下記「PDF の上書き方針」。
4. **機密情報:** 録画・キャプチャに個人情報が含まれる場合はマスクやダミー値にするか、社内ルールに従う。
5. **最終責任:** 画像の誤認や手順抜けは **人間がレビュー**し、貴社固有の業務ルールは文書化ルールに合わせる。

---

## PDF の上書き方針（重要）

- **別トピック**では `Manabie_退会.md` → `Manabie_退会.pdf` のように **ファイル名を分ける**。
- **エージェント:** 既存の共有 PDF を上書きしそうなときは **ユーザーに確認してから**実行してよい。
- **`build-pdf.mjs`:** 既定では既存 PDF があると **警告してから上書き**。厳格に止めたいときは **`MANUAL_PDF_STRICT_OVERWRITE=1`**、上書き時は **`--force`**。詳細は [SKILL.md](SKILL.md) Step E と [reference.md](reference.md)。

---

## クイックスタート

1. 作業フォルダ（例: `manual/`）に **[templates/](templates/) の中身をコピー**する。
2. `operation_manual.md` と `images/` を用意する（または AI に SKILL に従って作成させる）。
3. 必要なら `diagrams/process_flow.mmd` を編集する。
4. 依存関係を入れてビルドする。

```bash
cd manual
npm install
npm run build
```

生成物の例: `images/process_flow.png`、`operation_manual.pdf`

**複数マニュアル**は `node build-pdf.mjs 別件.md 別件.pdf` や `package.json` の用途別 `npm run build:xxx` で PDF 名を分ける。

---

## 配布・公開前のチェック

- `SKILL.md` の frontmatter（`name` / `description`）が意図どおりか
- `templates/package.json` の依存が手元で実行確認済みか
- `reference.md` のコマンドが現行手順と一致しているか
- サンプル画像・本文に **個人情報や社内秘密が含まれていないか**

---

## ライセンス

利用条件はリポジトリ利用者の方針に従ってください。未指定の場合は、利用前に作者へ確認することを推奨します。

---

## 参照

- リポジトリ: [https://github.com/rossoandoy/mov-to-pdf](https://github.com/rossoandoy/mov-to-pdf)
