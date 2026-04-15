# リファレンス（動画 → マニュアル PDF）

## ffmpeg フレーム抽出（例）

動画パスにスペースがある場合はクォートする。

```bash
mkdir -p frames
ffmpeg -y -i "your-recording.mov" -vf "fps=1/3,scale=1080:-2" -q:v 3 "frames/frame_%03d.jpg"
```

- **fps**: `1/3` は約 3 秒に 1 枚。長い録画では `1/4`〜`1/5` などにする。
- **scale**: 幅 1080px 前後（高さは `-2` で偶数に丸められることが多い）。

メタデータだけ確認する例:

```bash
ffmpeg -hide_banner -i "your-recording.mov" 2>&1 | head -25
```

## Markdown 必須構成チェックリスト

- [ ] タイトル
- [ ] はじめに（目的）
- [ ] 前提条件
- [ ] 操作手順（番号付き、具体動作）
- [ ] 完了時の状態

## 手順の網羅性（問合せ〜申請で抜けやすい導線）

録画だけだと省略されがちなので、該当する場合は本文・図の両方で明示する。

- [ ] **変換・提出などの直後**に **通知（ベル）** を開いて内容確認（レコード上／ホーム上のどちらか、または両方）
- [ ] **ホーム** タブや **アプリ切替** で「いまどのコンテキストにいるか」がわかる一文
- [ ] ホームの **問合せ管理** から **問合せステータス管理**（画面表記に合わせる）など、**ダッシュボード経由の別画面**
- [ ] 一覧・通知・検索のいずれかで **対象お問合せを再オープン** してから **入会状況 → Application**
- [ ] `process_flow.mmd` に上記に対応する **中間ノード** があり、本文の順序と一致

## 画像埋め込み

- 各手順の直下に `![説明](./images/xxx.jpg)` 形式であること（`![]()` が欠けるとプレビュー・PDF に出ない）。
- `images/` は `operation_manual.md` と同じディレクトリ階層に置く。

## Mermaid → PNG

```bash
npm install
npx mmdc -i diagrams/process_flow.mmd -o images/process_flow.png -w 1400 -b white
```

## PDF

```bash
npm install
npm run pdf
# または図も再生成: npm run build
```

### 上書きポリシー（エージェント・人間共通）

- **別トピックのマニュアル**では、`node build-pdf.mjs 別件.md 別件.pdf` のように **出力 PDF 名を分ける**。プロジェクトの `package.json` に用途別 `pdf:*` / `build:*` を足すと安全。
- **既定の `build-pdf.mjs`**: 出力先 PDF が既に存在する場合、**コンソールに警告**したうえで上書きする（同じマニュアルの再生成向け）。
- **誤上書きを防ぎたいとき**（CI など）: 環境変数 `MANUAL_PDF_STRICT_OVERWRITE=1` を付けると、既存 PDF があると **中止**（終了コード 1）。上書きする場合は **`--force`** を付ける。

```bash
# 厳格モード: 既存の Topic.pdf があると失敗（上書きするときだけ --force）
MANUAL_PDF_STRICT_OVERWRITE=1 node build-pdf.mjs Topic.md Topic.pdf
MANUAL_PDF_STRICT_OVERWRITE=1 node build-pdf.mjs --force Topic.md Topic.pdf
```

Chrome が見つからない場合は環境変数 `CHROME_PATH` に実行ファイルのフルパスを設定する。
