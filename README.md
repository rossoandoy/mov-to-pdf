# mov-to-pdf

画面操作の録画（mov / mp4 など）から、**操作マニュアル（Markdown）**・**画面キャプチャ**・**処理フロー図（Mermaid → PNG）**・**PDF（Chrome + puppeteer-core）**までを一気通貫で扱うための **エージェント向け手順（Skill）とテンプレート**をまとめたリポジトリです。

**公式リポジトリ:** [https://github.com/rossoandoy/mov-to-pdf](https://github.com/rossoandoy/mov-to-pdf)

---

## よくある質問：Claude や他の AI でも使える？

**はい、使えます。**

このリポジトリの中心は **人間と AI の両方が読める Markdown（[SKILL.md](SKILL.md)）** です。Cursor 専用のバイナリや API は含みません。したがって **Claude（Claude Code / Desktop / API）**、**ChatGPT**、**Gemini**、**GitHub Copilot** など、**テキスト手順をコンテキストとして渡せるツール**であれば、同じワークフローを再現できます。

| できること | できないこと（ツール側の制約） |
|------------|-------------------------------|
| SKILL.md を貼り付け・@参照して「この手順で録画からマニュアルを作って」と依頼する | ブラウザ版のみで **端末が使えない** 場合は、ffmpeg / npm は**ユーザーがローカルで実行**する必要がある |
| プロジェクトのルールファイル（`CLAUDE.md`、`AGENTS.md` 等）に要約を書いておく | 各社の「Skill」YAML形式は**その製品のドキュメントに合わせて**コピー先を変える |

---

## リポジトリに含まれるもの

| パス | 役割 |
|------|------|
| [SKILL.md](SKILL.md) | **メイン手順書**。ffmpeg 抽出 → 画像解析 → Markdown 執筆 → Mermaid を PNG 化 → PDF 出力までのステップ。 |
| [reference.md](reference.md) | コマンド早見・チェックリスト。 |
| [templates/](templates/) | 実際の作業フォルダへコピーする **`build-pdf.mjs`**・**`package.json`**・フロー図のひな型。 |

**用語の整理:** 「Skill」とは、AI に「こういう順序で作業して」と伝えるための **指示ドキュメント**のことです。製品によって `SKILL.md` の置き場所や frontmatter（YAML）の書き方が違うだけで、**中身の手順は共通**です。

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
2. Claude Code の場合、Anthropic 公表の **プロジェクト設定（Skills / CLAUDE.md 等）** の手順に従い、**Skills** や **CLAUDE.md** に「録画マニュアル作成は `docs/skills/.../SKILL.md` に従う」と一文入れておくと毎回の説明が省けます。
3. frontmatter（`---` で囲んだ YAML）は、Claude Code の Skill 形式に合わせて **名前や description だけ調整**してよい。手順本文はそのままで動きます。

**活用のコツ:** 長い `SKILL.md` を毎回読ませるより、プロジェクト用に **「Step A〜E の一行要約」** を `CLAUDE.md` に書いておき、詳細はファイル参照にするとトークンを節約できます。

---

### 3. GitHub Copilot（VS Code / JetBrains）

1. リポジトリをワークスペースに開く。
2. **Custom instructions** または **プロンプト用メモ**に、[SKILL.md](SKILL.md) の「Step A〜E」の見出しと [reference.md](reference.md) の ffmpeg 例を貼る。
3. Copilot Chat で「この手順で `manual/` の PDF を更新して」と依頼する。

**活用のコツ:** Copilot はリポジトリ内ファイルを参照しやすいので、`SKILL.md` をリポジトリにコミットしておくと `@workspace` 参照がしやすくなります。

---

### 4. ChatGPT / Google Gemini（Web）

1. [SKILL.md](SKILL.md) を開き、必要なセクション（Step A〜E）をコピーするか、ファイルをアップロードできるプランで **ファイルとして添付**する。
2. 「この手順に従い、抽出したフレームの説明から Markdown 案を書いて」と依頼する。

**制約:** ブラウザ版だけでは **ffmpeg・npm を実行できない**ことが多いです。その場合の役割分担は次のとおりです。

- **AI:** フレーム画像の説明、Markdown 本文、Mermaid ソースの草案。
- **人間（または Cursor 等）:** ターミナルでの ffmpeg、`npm run build`、PDF の生成。

---

### 5. その他（Gemini CLI、ローカル LLM、自作スクリプト）

- **共通:** `SKILL.md` は **プレーンな Markdown** なので、どのクライアントからでも読み込めるようにしておける。
- **ローカル LLM:** 手順の追従精度はモデルに依存するため、**Step を細かい単位で依頼**する（「まず Step A の ffmpeg コマンドだけ実行して」など）。

---

## 活用ガイドライン（共通）

1. **環境を先に揃える:** ffmpeg、Node.js（LTS 推奨）、Google Chrome がインストール済みか確認する（[必要な環境](#必要な環境)）。
2. **作業ディレクトリを一箇所に決める:** 例として `manual/` に `templates/` を展開し、動画・画像・Markdown・PDF をまとめる。
3. **複数トピックのマニュアルがある場合:** 入出力ファイル名を分ける（例: `TopicA.md` → `TopicA.pdf`）。既定の `operation_manual.pdf` だけを何度もビルドすると **上書き**されます。詳細は下記「PDF の上書き方針」。
4. **機密情報:** 録画・キャプチャに個人情報が含まれる場合は、マスクやダミー値に差し替えるか、社内ルールに従う。
5. **AI に任せる範囲:** 画像の内容推測や文章化は得意だが、**貴社固有の業務ルール**は人間が最終確認する。

---

## PDF の上書き方針（重要）

- **別トピックのマニュアル**では、`Manabie_退会.md` → `Manabie_退会.pdf` のように **ファイル名を分ける**。
- **エージェント向け:** 既存の共有 PDF を上書きしそうなときは、**ユーザーに確認してから**実行してよい。
- **テンプレートの `build-pdf.mjs`:** 既定では既存 PDF があると **警告してから上書き**。誤上書きを防ぎたいときは環境変数 **`MANUAL_PDF_STRICT_OVERWRITE=1`** で中止し、意図した上書きだけ **`--force`** を付ける。詳細は [SKILL.md](SKILL.md) Step E と [reference.md](reference.md)。

---

## クイックスタート（手動でも AI でも）

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

## できること（機能一覧）

- 長い録画を ffmpeg でフレーム化し、時系列で画面を読み取って手順を書く
- Markdown と `./images/` のキャプチャを PDF にまとめる
- Mermaid は PDF で崩れやすいため、**CLI で PNG 化してから**埋め込む

---

## 必要な環境

- **ffmpeg**（録画から静止画を切り出す）
- **Node.js** と **npm**（PDF 生成・Mermaid CLI）
- **Google Chrome** または **Chromium**（`puppeteer-core` で印刷 PDF）。見つからない場合は **`CHROME_PATH`** に実行ファイルのフルパスを指定

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
