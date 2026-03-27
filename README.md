# mov-to-pdf（Cursor Agent Skill）

システム操作の画面録画（mov/mp4 等）から、**操作マニュアル（Markdown）**・**画面キャプチャ**・**処理ステップ図（Mermaid → PNG）**・**PDF（Chrome + puppeteer-core）**までを一連で扱うための **Cursor Agent Skill** です。

## 想定ユースケース

- 画面録画から、ユーザー向けの手順書を短時間で作りたい
- Markdown と PDF の両方で納品したい
- Mermaid 図を PDF でも崩さずに表示したい

## 含まれるもの

| ファイル | 説明 |
|----------|------|
| [SKILL.md](SKILL.md) | エージェント向け手順（ffmpeg 抽出 → 画像解析 → Markdown → 図 → PDF） |
| [reference.md](reference.md) | ffmpeg / npm コマンド早見・チェックリスト |
| [templates/](templates/) | 作業用ディレクトリにコピーして使う `build-pdf.mjs`・`package.json`・フロー図ひな型 |

## クイックスタート

1. 任意の作業フォルダに `templates/` の内容をコピー
2. `operation_manual.md` と `images/` を用意
3. 必要なら `diagrams/process_flow.mmd` を編集
4. 依存関係をインストールしてビルド

```bash
npm install
npm run build
```

生成物:
- `images/process_flow.png`
- `operation_manual.pdf`

## Cursor での使い方

1. リポジトリを clone するか、`SKILL.md` だけをコピーする。
2. 個人スキルとして使う場合は、Cursor のスキルディレクトリに配置する（例: `~/.cursor/skills/video-to-manual-pdf/SKILL.md` と同じ内容）。
3. チャットで「画面録画からマニュアル PDF を作りたい」などと依頼すると、エージェントが [SKILL.md](SKILL.md) に従って処理できる。

## 配布前チェック

- `SKILL.md` の frontmatter（`name` / `description`）が最新
- `templates/package.json` の依存バージョンが実行確認済み
- `reference.md` のコマンドが現行手順と一致
- サンプルに個人情報や社内情報が含まれていない

## ライセンス

リポジトリ利用者のライセンス方針に従ってください（未指定の場合は利用前に作者に確認してください）。

## 参照

- 元リポジトリ名: **mov-to-pdf**
- GitHub: [https://github.com/rossoandoy/mov-to-pdf](https://github.com/rossoandoy/mov-to-pdf)
