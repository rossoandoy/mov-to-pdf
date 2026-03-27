/**
 * Markdown + ./images を A4 PDF に出力する（Google Chrome / Chromium 必須）
 *
 * 配置: 作業ディレクトリ直下に置き、同じ階層に operation_manual.md（または環境変数で指定）がある想定。
 *
 * Usage:
 *   npm install && npm run pdf
 *
 * 環境変数（任意）:
 *   MANUAL_MD  入力 Markdown ファイル名（既定: operation_manual.md）
 *   MANUAL_PDF 出力 PDF ファイル名（既定: operation_manual.pdf）
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manualDir = __dirname;

const mdName = process.env.MANUAL_MD || "operation_manual.md";
const pdfName = process.env.MANUAL_PDF || "operation_manual.pdf";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

function findChrome() {
  for (const p of chromeCandidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    "Chrome / Chromium が見つかりません。CHROME_PATH を設定するか、build-pdf.mjs の chromeCandidates にパスを追加してください。"
  );
  process.exit(1);
}

const mdPath = join(manualDir, mdName);
const md = readFileSync(mdPath, "utf8");
const bodyHtml = await marked.parse(md, { async: true });

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>操作マニュアル</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  body {
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #222;
  }
  h1 { font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 0.25em; }
  h2 { font-size: 13pt; margin-top: 1.3em; border-bottom: 1px solid #bbb; padding-bottom: 0.2em; }
  h3 { font-size: 11pt; margin-top: 1em; }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0.6em 0;
    page-break-inside: avoid;
  }
  ol, ul { padding-left: 1.35em; }
  li { margin: 0.3em 0; }
  p { margin: 0.45em 0; }
  strong { font-weight: 600; }
  a { color: #1a1a1a; word-break: break-all; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

const htmlPath = join(manualDir, "_pdf_temp.html");
writeFileSync(htmlPath, html, "utf8");

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });

const pdfPath = join(manualDir, pdfName);
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
});

await browser.close();
try {
  unlinkSync(htmlPath);
} catch {
  /* ignore */
}

console.log("PDF を出力しました:", pdfPath);
