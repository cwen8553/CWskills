#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

function argsOf(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") out.input = argv[++i];
    else if (argv[i] === "--output") out.output = argv[++i];
  }
  if (!out.input || !out.output) throw new Error("Usage: build_batch_index.mjs --input manifest.json --output 工艺单管理总表.xlsx");
  return out;
}

const clean = (value) => value === null || value === undefined ? "" : String(value);
const linkFormula = (target, label) => target ? `=HYPERLINK("${clean(target).replaceAll('"', '""').replaceAll('\\', '/')}","${label}")` : "";

async function imageDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = [".jpg", ".jpeg"].includes(ext) ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
  const bytes = await fs.readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function main() {
  const args = argsOf(process.argv.slice(2));
  const data = JSON.parse(await fs.readFile(args.input, "utf8"));
  const items = data.items || [];
  const wb = Workbook.create();
  const sheet = wb.worksheets.add("工艺单管理总表");
  sheet.showGridLines = false;
  const widths = [9, 12, 24, 16, 24, 14, 14, 16, 18, 18, 16, 16, 18, 26];
  widths.forEach((width, index) => { sheet.getCell(0, index).format.columnWidth = width; });
  sheet.getRange("A1:N2").merge();
  sheet.getRange("A1").values = [[data.title || "工艺单管理总表"]];
  sheet.getRange("A1:N2").format = { fill: "#111111", font: { name: "Arial", size: 18, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.getRange("A4:N4").values = [["顺序", "状态", "款式效果图", "款号", "产品名称", "Excel工艺单", "PDF工艺单", "做样方式", "做样负责人", "样衣状态", "大货负责方", "大货状态", "最新版本", "备注"]];
  sheet.getRange("A4:N4").format = { fill: "#333333", font: { name: "Arial", size: 9, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#FFFFFF" } };
  const rows = items.map((item, index) => [index + 1, item.status || "", "", item.styleNo || "", item.productName || "", "", "", item.sampleMode || "", item.sampleOwner || "", item.sampleStatus || "", item.bulkProducer || "", item.bulkStatus || "", item.version || "", item.note || ""]);
  if (!rows.length) rows.push([1, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  sheet.getRange(`A5:N${4 + rows.length}`).values = rows;
  sheet.getRange(`A5:N${4 + rows.length}`).format = { fill: "#FFFFFF", font: { name: "Arial", size: 9, color: "#111111" }, verticalAlignment: "center", horizontalAlignment: "left", wrapText: true, borders: { preset: "all", style: "thin", color: "#B8B8B8" } };
  for (let i = 0; i < items.length; i += 1) {
    const row = 5 + i;
    sheet.getRange(`F${row}`).formulas = [[linkFormula(items[i].excelPath, "打开 Excel")]];
    sheet.getRange(`G${row}`).formulas = [[linkFormula(items[i].pdfPath, "打开 PDF")]];
    sheet.getRange(`A${row}:N${row}`).format.rowHeight = 78;
    if (items[i].effectImage && await fs.access(items[i].effectImage).then(() => true).catch(() => false)) {
      const dataUrl = await imageDataUrl(items[i].effectImage);
      sheet.images.add({ dataUrl, anchor: { from: { row: row - 1, col: 2 }, extent: { widthPx: 120, heightPx: 92 } } });
    }
  }
  wb.recalculate();
  const output = await SpreadsheetFile.exportXlsx(wb);
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await output.save(args.output);
  process.stdout.write(`${args.output}\n`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
