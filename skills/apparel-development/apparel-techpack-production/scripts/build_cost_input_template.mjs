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
  if (!out.input || !out.output) throw new Error("Usage: build_cost_input_template.mjs --input manifest.json --output 成本与大货信息填写表.xlsx");
  return out;
}

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
  const sheet = wb.worksheets.add("成本与大货信息");
  sheet.showGridLines = false;
  const headers = ["顺序", "状态", "模特效果参考图", "款号", "品类", "面料编号", "面料名称", "面料幅宽(cm)", "面料用量(m)", "面料单价", "工费", "辅料", "辅料尺寸", "辅料用量", "辅料单价", "包装", "包装用量", "水洗标", "主标/尺码标", "总成衣成本", "国内段运输费", "板房/工厂做样", "大货负责方", "备注"];
  const widths = [8, 12, 24, 15, 14, 16, 24, 14, 14, 14, 14, 22, 20, 14, 14, 20, 14, 18, 18, 16, 16, 18, 18, 28];
  widths.forEach((width, index) => { sheet.getCell(0, index).format.columnWidth = width; });
  sheet.getRange("A1:X2").merge();
  sheet.getRange("A1").values = [[data.title || "成本与大货信息填写表"]];
  sheet.getRange("A1:X2").format = { fill: "#111111", font: { name: "Arial", size: 18, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.getRange("A4:X4").values = [headers];
  sheet.getRange("A4:X4").format = { fill: "#333333", font: { name: "Arial", size: 8, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#FFFFFF" } };
  const rows = items.map((item, index) => [index + 1, item.status || "", "", item.styleNo || "", item.category || "", item.fabricCode || "", item.fabricName || "", item.fabricWidth ?? "", item.fabricConsumption ?? "", item.fabricUnitPrice ?? "", item.laborCost ?? "", item.trim || "", item.trimSize || "", item.trimConsumption ?? "", item.trimUnitPrice ?? "", item.packaging || "", item.packagingConsumption ?? "", item.careLabel || "", item.mainSizeLabel || "", "", item.domesticFreight ?? "", item.sampleMode || "", item.bulkProducer || "", item.note || ""]);
  if (!rows.length) rows.push([1, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  sheet.getRange(`A5:X${4 + rows.length}`).values = rows;
  sheet.getRange(`A5:X${4 + rows.length}`).format = { fill: "#FFFFFF", font: { name: "Arial", size: 8, color: "#111111" }, verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#B8B8B8" } };
  sheet.getRange(`H5:X${4 + rows.length}`).format.fill = "#F3F3F3";
  for (let i = 0; i < rows.length; i += 1) {
    const row = 5 + i;
    sheet.getRange(`T${row}`).formulas = [[`=IF(COUNT(I${row},J${row},K${row},N${row},O${row},Q${row},R${row},S${row})=0,"",IF(OR(AND(I${row}<>"",J${row}=""),AND(I${row}="",J${row}<>""),AND(N${row}<>"",O${row}=""),AND(N${row}="",O${row}<>"")),"待补全",IF(COUNT(I${row},J${row},K${row},N${row},O${row},Q${row},R${row},S${row})<8,"待确认",I${row}*J${row}+K${row}+N${row}*O${row}+Q${row}+R${row}+S${row})))`]];
    sheet.getRange(`A${row}:X${row}`).format.rowHeight = 52;
    if (items[i]?.effectImage && await fs.access(items[i].effectImage).then(() => true).catch(() => false)) {
      const dataUrl = await imageDataUrl(items[i].effectImage);
      sheet.images.add({ dataUrl, anchor: { from: { row: row - 1, col: 2 }, extent: { widthPx: 120, heightPx: 62 } } });
    }
  }
  sheet.getRange(`H5:U${4 + rows.length}`).setNumberFormat("#,##0.000");
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
