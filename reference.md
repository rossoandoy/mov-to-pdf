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

Chrome が見つからない場合は環境変数 `CHROME_PATH` に実行ファイルのフルパスを設定する。
