#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";
import { validateTechpackInput } from "./validate_techpack_input.mjs";

const FONT = "Arial";
const COLOR = {
  navy: "#111111",
  blue: "#333333",
  paleBlue: "#E8E8E8",
  ink: "#111111",
  mid: "#666666",
  border: "#B8B8B8",
  input: "#F3F3F3",
  warning: "#DCDCDC",
  calc: "#E6E6E6",
  white: "#FFFFFF",
  gray: "#F5F5F5",
};

function parseArgs(argv) {
  const out = { mode: "draft" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") out.input = argv[++i];
    else if (argv[i] === "--output-dir") out.outputDir = argv[++i];
    else if (argv[i] === "--logo") out.logo = argv[++i];
    else if (argv[i] === "--render-dir") out.renderDir = argv[++i];
    else if (argv[i] === "--mode") out.mode = argv[++i];
  }
  if (!out.input || !out.outputDir) throw new Error("Usage: build_techpack_workbook.mjs --input order.json --output-dir outputs [--logo logo.png] [--render-dir previews] [--mode draft|finalize]");
  return out;
}

function cleanName(value) {
  return String(value || "TECHPACK-TEMPLATE").replace(/[\\/:*?"<>|]/g, "-").trim();
}

function quoteSheet(name) {
  return `'${String(name).replaceAll("'", "''")}'`;
}

function yesNo(value) {
  if (value === true || value === "是") return "是";
  if (value === false || value === "否") return "否";
  return "否";
}

function valueOrBlank(value) {
  return value === undefined || value === null ? "" : value;
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => { sheet.getCell(0, index).format.columnWidth = width; });
}

function baseSheet(sheet) {
  sheet.showGridLines = false;
}

function sectionTitle(sheet, range, title, subtitle = "") {
  sheet.getRange(range).merge();
  const cell = range.split(":")[0];
  sheet.getRange(cell).values = [[title]];
  sheet.getRange(range).format = {
    fill: COLOR.navy,
    font: { name: FONT, size: 13, bold: true, color: COLOR.white },
    verticalAlignment: "center",
    horizontalAlignment: "left",
    borders: { preset: "outside", style: "thin", color: COLOR.navy },
  };
  sheet.getRange(range).format.rowHeight = 28;
  if (subtitle) {
    const row = Number(cell.match(/\d+/)[0]) + 1;
    const startCol = cell.match(/[A-Z]+/)[0];
    const endCol = range.split(":")[1].match(/[A-Z]+/)[0];
    const subRange = `${startCol}${row}:${endCol}${row}`;
    sheet.getRange(subRange).merge();
    sheet.getRange(`${startCol}${row}`).values = [[subtitle]];
    sheet.getRange(subRange).format = {
      fill: COLOR.paleBlue,
      font: { name: FONT, size: 8, italic: true, color: COLOR.mid },
      wrapText: true,
      verticalAlignment: "center",
      borders: { preset: "outside", style: "thin", color: COLOR.border },
    };
    sheet.getRange(subRange).format.rowHeight = 26;
  }
}

function tableHeader(sheet, range, values) {
  sheet.getRange(range).values = [values];
  sheet.getRange(range).format = {
    fill: COLOR.blue,
    font: { name: FONT, size: 9, bold: true, color: COLOR.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: COLOR.white },
  };
  sheet.getRange(range).format.rowHeight = 32;
}

function bodyFormat(sheet, range, { fill = COLOR.white, height = 30, wrap = true } = {}) {
  sheet.getRange(range).format = {
    fill,
    font: { name: FONT, size: 9, color: COLOR.ink },
    verticalAlignment: "center",
    wrapText: wrap,
    borders: { preset: "all", style: "thin", color: COLOR.border },
  };
  sheet.getRange(range).format.rowHeight = height;
}

function labelFormat(sheet, range) {
  sheet.getRange(range).format = {
    fill: COLOR.gray,
    font: { name: FONT, size: 9, bold: true, color: COLOR.ink },
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: COLOR.border },
  };
}

function inputFormat(sheet, range) {
  sheet.getRange(range).format.fill = COLOR.input;
}

function padRows(rows, count, width) {
  const out = rows.slice(0, count);
  while (out.length < count) out.push(Array(width).fill(""));
  return out;
}

function parseSizes(order) {
  if (Array.isArray(order.sizes) && order.sizes.length) return order.sizes.slice(0, 8).map(String);
  const raw = String(order.sizeRange || "").toUpperCase().replaceAll(" ", "");
  const scale = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const match = raw.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/);
  if (match && scale.includes(match[1]) && scale.includes(match[2])) {
    const a = scale.indexOf(match[1]);
    const b = scale.indexOf(match[2]);
    if (a <= b) return scale.slice(a, b + 1).slice(0, 8);
  }
  return ["Size 1", "Size 2", "Size 3", "Size 4", "Size 5"];
}

async function fileDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
  const bytes = await fs.readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function addLogo(sheet, logoPath, fallbackText = "") {
  if (!logoPath) return;
  try {
    const dataUrl = await fileDataUrl(logoPath);
    sheet.images.add({ dataUrl, anchor: { from: { row: 0, col: 0 }, extent: { widthPx: 220, heightPx: 62 } } });
  } catch {
    sheet.getRange("A1:C2").merge();
    sheet.getRange("A1").values = [[fallbackText]];
    sheet.getRange("A1:C2").format.font = { name: FONT, size: 20, bold: true, color: COLOR.navy };
  }
}

async function addBrandLogo(sheet, logoPath, fallbackText = "") {
  if (!logoPath) return;
  try {
    const dataUrl = await fileDataUrl(logoPath);
    sheet.images.add({ dataUrl, anchor: { from: { row: 0, col: 9 }, extent: { widthPx: 190, heightPx: 94 } } });
  } catch {
    sheet.getRange("J1:M3").merge();
    sheet.getRange("J1").values = [[fallbackText]];
    sheet.getRange("J1:M3").format.font = { name: FONT, size: 16, bold: true, color: COLOR.navy };
  }
}

async function writeCover(sheet, data, logoPath, internal, validation) {
  baseSheet(sheet);
  setWidths(sheet, [15, 18, 18, 4, 15, 18, 18, 4, 15, 18, 18, 18, 18]);
  sheet.getRange("A1:M3").format.rowHeight = 24;
  await addLogo(sheet, logoPath);
  sheet.getRange("D1:M2").merge();
  sheet.getRange("D1").values = [[data.order?.documentTitle || "服装工艺单"]];
  sheet.getRange("D1:M2").format = { font: { name: FONT, size: 18, bold: true, color: COLOR.navy }, horizontalAlignment: "right", verticalAlignment: "center" };
  sheet.getRange("A4:M4").merge();
  sheet.getRange("A4").values = [["TECHNICAL SPECIFICATION"]];
  sheet.getRange("A4:M4").format = { fill: internal ? COLOR.warning : COLOR.paleBlue, font: { name: FONT, size: 10, bold: true, color: internal ? "#9C0006" : COLOR.navy }, horizontalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
  const o = data.order || {};
  const common = [
    ["订单编号", valueOrBlank(o.orderId), "", "", "款号", valueOrBlank(o.styleNo), "", "", "版本", valueOrBlank(o.version), "", "", ""],
    ["产品名称", valueOrBlank(o.productName), "", "", "客户", valueOrBlank(o.customer), "", "", "品牌", valueOrBlank(o.brand), "", "", ""],
    ["目标市场", valueOrBlank(o.market), "", "", "负责人", valueOrBlank(o.owner), "", "", "季节", valueOrBlank(o.season), "", "", ""],
    ["基础尺码", valueOrBlank(o.baseSize), "", "", "尺码范围", valueOrBlank(o.sizeRange), "", "", "尺码配比", valueOrBlank(o.sizeRatio), "", "", ""],
    ["币种", valueOrBlank(o.currency || "RMB"), "", "", "报价日期", valueOrBlank(o.quoteDate), "", "", "有效期至", valueOrBlank(o.quoteValidUntil), "", "", ""],
  ];
  sheet.getRange("A6:M10").values = common;
  bodyFormat(sheet, "A6:M10", { height: 34 });
  for (const col of ["A", "E", "I"]) labelFormat(sheet, `${col}6:${col}10`);
  for (const range of ["B6:D10", "F6:H10", "J6:M10"]) inputFormat(sheet, range);
  if (internal) {
    const rows = [
      ["目标到岸成本", valueOrBlank(o.targetLandedCost), "", "", "利润方法", valueOrBlank(o.profitMethod), "", "", "利润率/加成率", valueOrBlank(o.profitRate), "", "", ""],
      ["包装计入", yesNo(o.includePackaging), "", "", "运费计入", yesNo(o.includeFreight), "", "", "服务费计入", yesNo(o.includeService), "", "", ""],
      ["税费计入", yesNo(o.includeTax), "", "", "税率", valueOrBlank(o.taxRate), "", "", "订单状态", valueOrBlank(o.status || "草稿"), "", "", ""],
    ];
    sheet.getRange("A12:M14").values = rows;
    bodyFormat(sheet, "A12:M14", { height: 34 });
    for (const col of ["A", "E", "I"]) labelFormat(sheet, `${col}12:${col}14`);
    for (const range of ["B12:D14", "F12:H14", "J12:M14"]) inputFormat(sheet, range);
    sheet.getRange("F12").dataValidation = { rule: { type: "list", values: ["margin", "markup", ""] } };
    for (const cell of ["B13", "F13", "J13", "B14"]) sheet.getRange(cell).dataValidation = { rule: { type: "list", values: ["是", "否"] } };
    sheet.getRange("J12").setNumberFormat("0.0%");
    sheet.getRange("F14").setNumberFormat("0.0%");
  }
  const gateRow = internal ? 16 : 12;
  sheet.getRange(`A${gateRow}:M${gateRow}`).merge();
  sheet.getRange(`A${gateRow}`).values = [[validation.valid ? "当前输入通过结构校验" : `待确认：${validation.issues.filter((x) => x.level === "error").length} 个阻断项`]];
  sheet.getRange(`A${gateRow}:M${gateRow}`).format = { fill: validation.valid ? COLOR.calc : COLOR.warning, font: { name: FONT, size: 11, bold: true, color: validation.valid ? "#1E4D1E" : "#9C0006" }, horizontalAlignment: "center", borders: { preset: "outside", style: "medium", color: COLOR.border } };
  sheet.getRange(`A${gateRow}:M${gateRow}`).format.rowHeight = 30;
  sheet.getRange(`A${gateRow + 2}:M${gateRow + 4}`).merge();
  sheet.getRange(`A${gateRow + 2}`).values = [[o.notes || "设计效果图不等于生产尺寸。三视图、POM、颜色、BOM、工艺和图稿必须分别批准。"]];
  sheet.getRange(`A${gateRow + 2}:M${gateRow + 4}`).format = { fill: COLOR.gray, font: { name: FONT, size: 9, color: COLOR.mid }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
}

function writeRequirementsResearch(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(5);
  setWidths(sheet, [14, 20, 24, 44, 13, 28, 18, 34, 18, 20, 22, 32]);
  sectionTitle(sheet, "A1:L1", "需求、市场趋势与对标品", "趋势和对标用于产品决策；零售价和公开信息不得直接进入供应商成本。每条研究结论保留来源与抓取日期。");
  tableHeader(sheet, "A4:H4", ["需求ID", "章节", "字段", "要求/约束", "单位", "状态", "来源ID", "定位/备注"]);
  const reqRows = (data.requirements || []).map((r) => [r.id || "", r.section || "", r.field || "", valueOrBlank(r.value), r.unit || "", r.status || "pending", r.sourceId || "", [r.sourceLocator, r.note].filter(Boolean).join(" | ")]);
  sheet.getRange("A5:H29").values = padRows(reqRows, 25, 8);
  bodyFormat(sheet, "A5:H29", { height: 32 });
  inputFormat(sheet, "A5:H29");
  sheet.getRange("F5:F29").dataValidation = { rule: { type: "list", values: ["confirmed", "development", "reference", "required", "pending", "conflict", "na"] } };

  tableHeader(sheet, "A32:L32", ["趋势ID", "趋势结论", "市场", "目标用户", "时间窗", "信号", "证据", "产品影响", "限制", "来源URL", "抓取日期", "状态"]);
  const trends = (data.research?.trends || []).map((r) => [r.trendId || "", r.claim || "", r.market || "", r.audience || "", r.window || "", r.signal || "", r.evidence || "", r.implication || "", r.limitations || "", r.sourceUrl || "", r.capturedAt || "", r.status || "pending"]);
  sheet.getRange("A33:L40").values = padRows(trends, 8, 12);
  bodyFormat(sheet, "A33:L40", { height: 44 });
  inputFormat(sheet, "A33:L40");

  tableHeader(sheet, "A43:L43", ["对标ID", "品牌", "产品/SKU", "市场", "零售价", "币种", "面料", "版型/工艺", "评分/评论数", "来源URL", "抓取日期", "备注"]);
  const benchmarks = (data.research?.benchmarks || []).map((r) => [r.benchmarkId || "", r.brand || "", [r.product, r.sku].filter(Boolean).join(" / "), r.market || "", valueOrBlank(r.price), r.currency || "", r.material || "", [r.fit, r.construction].filter(Boolean).join(" / "), [r.rating, r.reviewCount].filter((x) => x !== undefined && x !== null && x !== "").join(" / "), r.sourceUrl || "", r.capturedAt || "", r.note || ""]);
  sheet.getRange("A44:L51").values = padRows(benchmarks, 8, 12);
  bodyFormat(sheet, "A44:L51", { height: 44 });
  inputFormat(sheet, "A44:L51");
  sheet.getRange("E44:E51").setNumberFormat("#,##0.00");
}

function writeSizeBasis(sheet, data) {
  baseSheet(sheet);
  const basis = data.sizeBasis || {};
  setWidths(sheet, [13, 15, 17, 20, 17, 20, 17, 20, 20, 34]);
  sectionTitle(sheet, "A1:J1", "美国女装尺码基准、成衣松量与放行控制", "人体尺寸用于定义适配人群；成衣POM用于生产和验货。两者必须分开管理。");
  sheet.getRange("A3:J5").merge();
  sheet.getRange("A3").values = [[basis.basisNote || "美国女装尺码基准待确认。"]];
  sheet.getRange("A3:J5").format = { fill: COLOR.paleBlue, font: { name: FONT, size: 9, color: COLOR.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };

  tableHeader(sheet, "A7:J7", ["尺码", "US数字码", "胸围(in)", "胸围(cm)", "腰围(in)", "腰围(cm)", "臀围(in)", "臀围(cm)", "主基准来源", "状态"]);
  const bodyRows = (basis.bodyRows || []).map((r) => [r.size || "", r.usNumeric || "", r.bustIn || "", r.bustCm || "", r.waistIn || "", r.waistCm || "", r.hipIn || "", r.hipCm || "", basis.primarySourceId || "", basis.status || "development"]);
  sheet.getRange("A8:J12").values = padRows(bodyRows, 5, 10);
  bodyFormat(sheet, "A8:J12", { height: 34 });
  inputFormat(sheet, "A8:J12");

  tableHeader(sheet, "A15:H15", ["尺码", "成衣胸围(cm)", "对人体胸围上限松量(cm)", "成衣臀围(cm)", "对人体臀围上限松量(cm)", "放松腰围(cm)", "拉伸腰围(cm)", "数据性质"]);
  const easeRows = (basis.easeRows || []).map((r) => [r.size || "", valueOrBlank(r.garmentBust), valueOrBlank(r.bustEaseToMax), valueOrBlank(r.garmentHip), valueOrBlank(r.hipEaseToMax), valueOrBlank(r.relaxedWaist), valueOrBlank(r.extendedWaist), "开发建议，需样衣批准"]);
  sheet.getRange("A16:H20").values = padRows(easeRows, 5, 8);
  bodyFormat(sheet, "A16:H20", { height: 34 });
  inputFormat(sheet, "A16:H20");
  sheet.getRange("B16:G20").setNumberFormat("0.0");

  tableHeader(sheet, "A23:J23", ["阶段", "生产放行控制", "", "", "", "", "", "", "", ""]);
  sheet.getRange("B23:J23").merge();
  const controls = (basis.releaseControls || []).map((x, i) => [`${i + 1}`, x]);
  sheet.getRange("A24:B29").values = padRows(controls, 6, 2);
  for (let row = 24; row <= 29; row += 1) sheet.getRange(`B${row}:J${row}`).merge();
  bodyFormat(sheet, "A24:J29", { height: 42 });
  inputFormat(sheet, "A24:J29");
  sheet.getRange("A31:J33").merge();
  sheet.getRange("A31").values = [[`主基准：${basis.primarySourceId || "待确认"}；交叉核对：${basis.crossCheckSourceId || "待确认"}。本表不是任一客户的已批准版型库，不可跳过样衣确认。`]];
  sheet.getRange("A31:J33").format = { fill: COLOR.warning, font: { name: FONT, size: 9, color: "#9C0006", bold: true }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
}

async function writeVisualSheet(sheet, data, logoPath, kind) {
  baseSheet(sheet);
  setWidths(sheet, [15, 18, 18, 18, 18, 18, 16, 18, 18, 18, 18, 18]);
  const isDesign = kind === "design";
  sectionTitle(sheet, "A1:L1", isDesign ? "设计效果图 / DESIGN RENDER" : "技术三视图 / TECHNICAL FLATS", isDesign ? "效果图只表达外观、配色和穿着场景，不作为尺寸或结构依据。" : "正面、侧面、背面技术图必须与POM、工艺、图稿位置对应；草图须经设计师批准后方可发布。" );
  const entries = isDesign ? (data.visuals?.designRenders || []) : (data.visuals?.technicalViews || []);
  const slots = isDesign ? 2 : 3;
  const slotRanges = isDesign ? [["A5:F25", 0, 0], ["G5:L25", 0, 6]] : [["A5:D25", 0, 0], ["E5:H25", 0, 4], ["I5:L25", 0, 8]];
  for (let i = 0; i < slots; i += 1) {
    const [range, , col] = slotRanges[i];
    sheet.getRange(range).merge();
    const entry = entries[i];
    if (entry?.path) {
      try {
        const dataUrl = await fileDataUrl(entry.path);
        sheet.images.add({ dataUrl, anchor: { from: { row: 4, col }, extent: { widthPx: isDesign ? 470 : 310, heightPx: 420 } } });
      } catch {
        sheet.getRange(range.split(":")[0]).values = [["图像文件无法读取"]];
      }
    } else {
      sheet.getRange(range.split(":")[0]).values = [[isDesign ? "插入设计效果图" : `插入${["正面", "侧面", "背面"][i]}技术图`]];
      sheet.getRange(range).format = { fill: COLOR.gray, font: { name: FONT, size: 14, bold: true, color: COLOR.mid }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "dashed", color: COLOR.border } };
    }
  }
  const row = 27;
  tableHeader(sheet, `A${row}:H${row}`, ["图像ID", "类型", "视图", "说明", "状态", "来源ID", "审批人", "审批日期"]);
  const rows = entries.map((x) => [x.id || "", x.type || (isDesign ? "design-render" : "technical-flat"), x.view || "", x.caption || "", x.status || "draft", x.sourceId || "", x.approvedBy || "", x.approvedAt || ""]);
  sheet.getRange(`A${row + 1}:H${row + 8}`).values = padRows(rows, 8, 8);
  bodyFormat(sheet, `A${row + 1}:H${row + 8}`, { height: 32 });
  inputFormat(sheet, `A${row + 1}:H${row + 8}`);
  sheet.getRange(`E${row + 1}:E${row + 8}`).dataValidation = { rule: { type: "list", values: ["draft", "pending", "approved", "rejected"] } };
  await addLogo(sheet, logoPath);
}

function writeColors(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [14, 20, 22, 18, 24, 15, 22, 24, 24, 18, 18, 14, 18, 30]);
  sectionTitle(sheet, "A1:N1", "颜色标准 / COLORWAYS", "纺织面料和线通常使用Pantone FHI TCX。屏幕色仅作预览；量产以已批准实物色卡或lab dip为准。");
  tableHeader(sheet, "A4:N4", ["色号ID", "颜色名称", "使用部件", "Pantone代码", "Pantone名称", "体系", "材质", "数字预览", "实物标准", "Lab Dip状态", "批准编号", "状态", "来源ID", "备注"]);
  const rows = (data.colorways || []).map((r) => [r.colorwayId || "", r.name || "", r.component || "", r.pantoneCode || "", r.pantoneName || "", r.system || "", r.material || "", r.digitalPreview || "", r.physicalStandard || "", r.labDipStatus || "", r.approvalId || "", r.status || "pending", r.sourceId || "", r.note || ""]);
  sheet.getRange("A5:N24").values = padRows(rows, 20, 14);
  bodyFormat(sheet, "A5:N24", { height: 34 });
  inputFormat(sheet, "A5:N24");
  sheet.getRange("F5:F24").dataValidation = { rule: { type: "list", values: ["FHI TCX", "FHI TPG", "PMS C", "PMS U", "其他"] } };
  sheet.getRange("J5:J24").dataValidation = { rule: { type: "list", values: ["待打样", "已提交", "修改中", "已批准", "不适用"] } };
  sheet.getRange("L5:L24").dataValidation = { rule: { type: "list", values: ["confirmed", "development", "pending", "conflict", "na"] } };
}

function writeBom(sheet, data, internal) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(5);
  if (internal) {
    setWidths(sheet, [12, 14, 20, 18, 38, 16, 18, 18, 17, 10, 14, 12, 11, 10, 12, 14, 10, 14, 14, 14, 18, 14, 14, 14, 14, 14, 14, 30]);
    sectionTitle(sheet, "A1:AB1", "BOM、采购与分摊成本", "黄色为人工输入；绿色为公式成本。缺失、临时或过期报价只能用于草稿。每个数量阶梯单独分摊MOQ和采购倍数。");
    tableHeader(sheet, "A4:AB4", ["行号", "类别", "部件", "位置", "完整规格", "物料编码", "供应商", "供应商编码", "颜色/Pantone", "单位", "单价", "单件用量", "损耗率", "MOQ", "采购倍数", "实际采购量", "计入成本", "报价状态", "报价日期", "有效期至", "来源ID", "理论单耗成本", "阶梯1单位成本", "阶梯2单位成本", "阶梯3单位成本", "阶梯4单位成本", "阶梯5单位成本", "备注"]);
    const rows = (data.bom || []).map((r) => [r.lineId || "", r.category || "", r.component || "", r.placement || "", r.spec || "", r.materialCode || "", r.supplier || "", r.supplierCode || "", r.colorRef || "", r.unit || "", valueOrBlank(r.unitPrice), valueOrBlank(r.consumption), valueOrBlank(r.wasteRate), valueOrBlank(r.moq), valueOrBlank(r.purchaseMultiple), valueOrBlank(r.actualPurchaseQty), yesNo(r.includeInCost !== false), r.quoteStatus || "missing", r.quoteDate || "", r.validUntil || "", r.sourceId || "", "", "", "", "", "", "", r.note || ""]);
    sheet.getRange("A5:AB34").values = padRows(rows, 30, 28);
    bodyFormat(sheet, "A5:AB34", { height: 38 });
    inputFormat(sheet, "A5:U34");
    sheet.getRange("V5:AA34").format.fill = COLOR.calc;
    sheet.getRange("B5:B34").dataValidation = { rule: { type: "list", values: ["主面料", "里料/衬", "辅料", "外协工艺"] } };
    sheet.getRange("Q5:Q34").dataValidation = { rule: { type: "list", values: ["是", "否"] } };
    sheet.getRange("R5:R34").dataValidation = { rule: { type: "list", values: ["confirmed", "provisional", "missing", "stale"] } };
    sheet.getRange("K5:K34").setNumberFormat("#,##0.000");
    sheet.getRange("L5:L34").setNumberFormat("0.000");
    sheet.getRange("M5:M34").setNumberFormat("0.0%");
    sheet.getRange("N5:P34").setNumberFormat("0.000");
    sheet.getRange("V5:AA34").setNumberFormat("#,##0.000");
    const qName = quoteSheet("12_阶梯报价");
    const tierCols = ["W", "X", "Y", "Z", "AA"];
    for (let r = 5; r <= 34; r += 1) {
      sheet.getRange(`V${r}`).formulas = [[`=IF($Q${r}<>"是",0,IF(OR(NOT(ISNUMBER($K${r})),NOT(ISNUMBER($L${r}))),"n.a.",$K${r}*$L${r}*(1+IF(ISNUMBER($M${r}),$M${r},0))))`]];
      for (let t = 0; t < 5; t += 1) {
        const qtyRef = `${qName}!$B${6 + t}`;
        const required = `${qtyRef}*$L${r}*(1+IF(ISNUMBER($M${r}),$M${r},0))`;
        const purchase = `MAX(${required},IF(ISNUMBER($N${r}),$N${r},0))`;
        const rounded = `IF(AND(ISNUMBER($O${r}),$O${r}>0),ROUNDUP(${purchase}/$O${r},0)*$O${r},${purchase})`;
        sheet.getRange(`${tierCols[t]}${r}`).formulas = [[`=IF($Q${r}<>"是",0,IF(OR($C${r}="",NOT(ISNUMBER($K${r})),NOT(ISNUMBER($L${r})),NOT(ISNUMBER(${qtyRef})),${qtyRef}<=0),"n.a.",IF(ISNUMBER($P${r}),$P${r}*$K${r}/${qtyRef},${rounded}*$K${r}/${qtyRef})))`]];
      }
    }
  } else {
    setWidths(sheet, [12, 15, 21, 19, 44, 16, 18, 18, 18, 11, 15, 14, 18, 30]);
    sectionTitle(sheet, "A1:N1", "物料清单 / BILL OF MATERIALS", "列出所有面料、里料、衬、辅料、线、闭合件、标签与包装所需部件。工厂不得自行替换未批准物料。");
    tableHeader(sheet, "A4:N4", ["行号", "类别", "部件", "位置", "完整规格", "物料编码", "供应商", "供应商编码", "颜色/Pantone", "单位", "用量", "物料状态", "来源ID", "备注"]);
    const rows = (data.bom || []).map((r) => [r.lineId || "", r.category || "", r.component || "", r.placement || "", r.spec || "", r.materialCode || "", r.supplier || "", r.supplierCode || "", r.colorRef || "", r.unit || "", valueOrBlank(r.consumption), r.quoteStatus === "confirmed" ? "approved" : (r.quoteStatus || "pending"), r.sourceId || "", r.note || ""]);
    sheet.getRange("A5:N34").values = padRows(rows, 30, 14);
    bodyFormat(sheet, "A5:N34", { height: 38 });
    inputFormat(sheet, "A5:N34");
    sheet.getRange("B5:B34").dataValidation = { rule: { type: "list", values: ["主面料", "里料/衬", "辅料", "外协工艺", "包装"] } };
    sheet.getRange("L5:L34").dataValidation = { rule: { type: "list", values: ["approved", "pending", "rejected", "na"] } };
    sheet.getRange("K5:K34").setNumberFormat("0.000");
  }
}

function writePom(sheet, data, sizes) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(5);
  const startSizeCol = 8;
  const sizeCols = sizes.map((_, i) => String.fromCharCode(65 + startSizeCol + i));
  const statusCol = String.fromCharCode(65 + startSizeCol + sizes.length);
  const sourceCol = String.fromCharCode(statusCol.charCodeAt(0) + 1);
  const noteCol = String.fromCharCode(statusCol.charCodeAt(0) + 2);
  const endCol = noteCol;
  setWidths(sheet, [11, 20, 20, 40, 10, 10, 10, 4, ...sizes.map(() => 12), 14, 16, 30]);
  sectionTitle(sheet, `A1:${endCol}1`, "成衣尺寸、POM与公差", "成衣尺寸、人体尺寸、半围和全围不得混用；开发建议必须经基础码首版、需要时的跳码样与洗后复尺批准。");
  tableHeader(sheet, `A4:${endCol}4`, ["POM", "中文名称", "英文名称", "测量方法", "单位", "公差+", "公差-", "", ...sizes, "状态", "来源ID", "备注"]);
  const rows = (data.pom || []).map((r) => [r.pomId || "", r.nameCn || "", r.nameEn || "", r.measurementMethod || "", r.unit || "", valueOrBlank(r.tolerancePlus), valueOrBlank(r.toleranceMinus), "", ...sizes.map((s) => valueOrBlank(r.values?.[s])), r.status || "pending", r.sourceId || "", r.note || ""]);
  sheet.getRange(`A5:${endCol}34`).values = padRows(rows, 30, 11 + sizes.length);
  bodyFormat(sheet, `A5:${endCol}34`, { height: 34 });
  inputFormat(sheet, `A5:${endCol}34`);
  sheet.getRange(`H4:H34`).clear({ applyTo: "formats" });
  sheet.getRange(`H4:H34`).clear({ applyTo: "contents" });
  sheet.getRange(`E5:E34`).dataValidation = { rule: { type: "list", values: ["cm", "in"] } };
  sheet.getRange(`${statusCol}5:${statusCol}34`).dataValidation = { rule: { type: "list", values: ["confirmed", "development", "pending", "conflict", "na"] } };
  sheet.getRange(`F5:G34`).setNumberFormat("0.0");
  for (const c of sizeCols) sheet.getRange(`${c}5:${c}34`).setNumberFormat("0.0");
}

function writeConstruction(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [13, 18, 38, 17, 17, 11, 15, 18, 18, 36, 14, 18]);
  sectionTitle(sheet, "A1:L1", "车缝结构与工艺", "缝型与线迹代码为开发建议，依ISO 4915/4916及常用ASTM D6193表达；工厂需按设备、面料与车样结果核对后批准。");
  tableHeader(sheet, "A4:L4", ["工序ID", "部位", "工艺说明", "缝型", "线迹类型", "针距/SPI", "缝份", "线材/线色", "设备", "质量要求", "状态", "来源ID"]);
  const rows = (data.construction || []).map((r) => [r.operationId || "", r.area || "", r.operation || "", r.seamType || "", r.stitchType || "", valueOrBlank(r.spi), r.seamAllowance || "", r.thread || "", r.machine || "", r.qualityNote || "", r.status || "pending", r.sourceId || ""]);
  sheet.getRange("A5:L34").values = padRows(rows, 30, 12);
  bodyFormat(sheet, "A5:L34", { height: 38 });
  inputFormat(sheet, "A5:L34");
  sheet.getRange("K5:K34").dataValidation = { rule: { type: "list", values: ["confirmed", "development", "pending", "conflict", "na"] } };
}

function writeArtworkPack(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [13, 21, 19, 24, 12, 12, 10, 12, 28, 14, 18, 28]);
  sectionTitle(sheet, "A1:L1", "图稿、标签与包装", "图稿需提供可生产矢量文件、成品尺寸、颜色数量、位置和方向。标签与包装内容按目标市场审核。");
  tableHeader(sheet, "A4:L4", ["图稿ID", "名称", "工艺", "位置", "宽", "高", "单位", "颜色数", "文件/比例", "状态", "来源ID", "备注"]);
  const art = (data.artwork || []).map((r) => [r.artworkId || "", r.name || "", r.technique || "", r.placement || "", valueOrBlank(r.width), valueOrBlank(r.height), r.unit || "", valueOrBlank(r.colorCount), [r.fileRef, r.scale].filter(Boolean).join(" / "), r.status || "pending", r.sourceId || "", r.note || ""]);
  sheet.getRange("A5:L16").values = padRows(art, 12, 12);
  bodyFormat(sheet, "A5:L16", { height: 36 });
  inputFormat(sheet, "A5:L16");
  tableHeader(sheet, "A19:L19", ["项目ID", "类别", "项目", "规格", "位置", "单位", "单件数量", "图稿引用", "状态", "来源ID", "审批人", "备注"]);
  const pack = (data.labelsPackaging || []).map((r) => [r.itemId || "", r.category || "", r.item || "", r.spec || "", r.placement || "", r.unit || "", valueOrBlank(r.quantityPerPiece), r.artworkRef || "", r.status || "pending", r.sourceId || "", r.approvedBy || "", r.note || ""]);
  sheet.getRange("A20:L34").values = padRows(pack, 15, 12);
  bodyFormat(sheet, "A20:L34", { height: 36 });
  inputFormat(sheet, "A20:L34");
  sheet.getRange("J5:J16").dataValidation = { rule: { type: "list", values: ["confirmed", "pending", "conflict", "na"] } };
  sheet.getRange("I20:I34").dataValidation = { rule: { type: "list", values: ["confirmed", "development", "pending", "conflict", "na"] } };
}

function writeTesting(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [13, 18, 22, 24, 38, 28, 18, 16, 14, 18, 32]);
  sectionTitle(sheet, "A1:K1", "测试、合规与质量批准", "测试项目由产品、材料和目标市场决定。模板不自动声明认证或法规合规；报告编号与结果必须来自真实证据。");
  tableHeader(sheet, "A4:K4", ["测试ID", "市场", "材料/产品", "标准/法规", "要求", "方法", "报告ID", "结果", "状态", "来源ID", "备注"]);
  const rows = (data.testing || []).map((r) => [r.testId || "", r.market || "", r.materialOrProduct || "", r.standard || "", r.requirement || "", r.method || "", r.reportId || "", r.result || "", r.status || "pending", r.sourceId || "", r.note || ""]);
  sheet.getRange("A5:K29").values = padRows(rows, 25, 11);
  bodyFormat(sheet, "A5:K29", { height: 38 });
  inputFormat(sheet, "A5:K29");
  sheet.getRange("I5:I29").dataValidation = { rule: { type: "list", values: ["confirmed", "pending", "failed", "na"] } };
}

function writeCostInputs(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [12, 14, 16, 16, 16, 16, 16, 16, 16, 15, 18, 14, 14, 30]);
  sectionTitle(sheet, "A1:N1", "阶梯成本输入", "数量来自报价页；车缝、工艺、定制、固定费、包装、运费与服务费必须分别填写。填0代表已确认零成本，空白代表未知。");
  tableHeader(sheet, "A4:N4", ["阶梯", "数量", "车缝/CMT", "标准工艺", "定制单价", "固定费合计", "包装单价", "运费单价", "服务费单价", "状态", "来源ID", "报价日期", "有效期至", "备注"]);
  const tiers = data.order?.quantityTiers || [];
  const costMap = new Map((data.tierCosts || []).map((x) => [Number(x.quantity), x]));
  const rows = [];
  for (let i = 0; i < 5; i += 1) {
    const q = valueOrBlank(tiers[i]);
    const r = costMap.get(Number(q)) || {};
    rows.push([`阶梯${i + 1}`, "", valueOrBlank(r.sewingUnitCost), valueOrBlank(r.processUnitCost), valueOrBlank(r.customUnitCost), valueOrBlank(r.setupCost), valueOrBlank(r.packagingUnitCost), valueOrBlank(r.freightUnitCost), valueOrBlank(r.serviceUnitCost), r.status || "missing", r.sourceId || "", r.quoteDate || "", r.validUntil || "", r.note || ""]);
  }
  sheet.getRange("A5:N9").values = rows;
  bodyFormat(sheet, "A5:N9", { height: 38 });
  sheet.getRange("B5:B9").formulas = [["='12_阶梯报价'!B6"], ["='12_阶梯报价'!B7"], ["='12_阶梯报价'!B8"], ["='12_阶梯报价'!B9"], ["='12_阶梯报价'!B10"]];
  sheet.getRange("B5:B9").format.fill = COLOR.calc;
  inputFormat(sheet, "C5:N9");
  sheet.getRange("J5:J9").dataValidation = { rule: { type: "list", values: ["confirmed", "provisional", "missing", "stale"] } };
  sheet.getRange("B5:I9").setNumberFormat("#,##0.00");
}

function writeQuote(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(5);
  setWidths(sheet, [11, 12, 13, 13, 13, 14, 13, 13, 13, 13, 13, 13, 13, 14, 13, 12, 15, 12, 15, 16, 15, 15, 20]);
  sectionTitle(sheet, "A1:W1", "阶梯成本与客户报价", "材料成本按每个数量阶梯分别处理MOQ与采购倍数。目标成本只用于差异比较，不替代供应商价格。利润方法必须明确为margin或markup。");
  tableHeader(sheet, "A5:W5", ["阶梯", "数量", "主面料", "里料/衬", "辅料", "BOM外协", "车缝/CMT", "标准工艺", "定制", "固定费分摊", "包装", "运费", "服务费", "选定成本基数", "利润方法", "利润率", "未税报价", "税率", "最终单价", "阶梯总额", "目标成本", "差异", "报价状态"]);
  const tiers = data.order?.quantityTiers || [];
  sheet.getRange("A6:A10").values = [["阶梯1"], ["阶梯2"], ["阶梯3"], ["阶梯4"], ["阶梯5"]];
  sheet.getRange("B6:B10").values = Array.from({ length: 5 }, (_, i) => [valueOrBlank(tiers[i])]);
  bodyFormat(sheet, "A6:W10", { height: 38 });
  inputFormat(sheet, "B6:B10");
  sheet.getRange("C6:W10").format.fill = COLOR.calc;
  const bom = quoteSheet("06_BOM");
  const cost = quoteSheet("11_成本输入");
  const cover = quoteSheet("01_封面发布");
  const tierCols = ["W", "X", "Y", "Z", "AA"];
  for (let i = 0; i < 5; i += 1) {
    const r = 6 + i;
    const bc = tierCols[i];
    for (const [target, category] of [["C", "主面料"], ["D", "里料/衬"], ["E", "辅料"], ["F", "外协工艺"]]) {
      sheet.getRange(`${target}${r}`).formulas = [[`=IF(NOT(ISNUMBER($B${r})),"n.a.",SUMIFS(${bom}!$${bc}$5:$${bc}$34,${bom}!$B$5:$B$34,"${category}",${bom}!$Q$5:$Q$34,"是"))`]];
    }
    sheet.getRange(`G${r}:M${r}`).formulas = [[
      `=${cost}!C${5 + i}`,
      `=${cost}!D${5 + i}`,
      `=${cost}!E${5 + i}`,
      `=IF(OR(NOT(ISNUMBER(${cost}!F${5 + i})),NOT(ISNUMBER($B${r})),$B${r}<=0),"n.a.",${cost}!F${5 + i}/$B${r})`,
      `=IF(${cover}!$B$13="是",${cost}!G${5 + i},0)`,
      `=IF(${cover}!$F$13="是",${cost}!H${5 + i},0)`,
      `=IF(${cover}!$J$13="是",${cost}!I${5 + i},0)`,
    ]];
    sheet.getRange(`N${r}`).formulas = [[`=IF(COUNT(C${r}:M${r})<>11,"n.a.",SUM(C${r}:M${r}))`]];
    sheet.getRange(`O${r}`).formulas = [[`=${cover}!$F$12`]];
    sheet.getRange(`P${r}`).formulas = [[`=${cover}!$J$12`]];
    sheet.getRange(`Q${r}`).formulas = [[`=IF(W${r}<>"可报价","n.a.",IF(O${r}="margin",N${r}/(1-P${r}),IF(O${r}="markup",N${r}*(1+P${r}),"n.a.")))`]];
    sheet.getRange(`R${r}`).formulas = [[`=${cover}!$F$14`]];
    sheet.getRange(`S${r}`).formulas = [[`=IF(NOT(ISNUMBER(Q${r})),"n.a.",IF(${cover}!$B$14="是",Q${r}*(1+R${r}),Q${r}))`]];
    sheet.getRange(`T${r}`).formulas = [[`=IF(AND(ISNUMBER(S${r}),ISNUMBER(B${r})),S${r}*B${r},"n.a.")`]];
    sheet.getRange(`U${r}`).formulas = [[`=${cover}!$B$12`]];
    sheet.getRange(`V${r}`).formulas = [[`=IF(AND(ISNUMBER(S${r}),ISNUMBER(U${r})),S${r}-U${r},"n.a.")`]];
    sheet.getRange(`W${r}`).formulas = [[`=IF(NOT(ISNUMBER(B${r})),"待输入数量",IF(COUNTIFS(${bom}!$Q$5:$Q$34,"是",${bom}!$C$5:$C$34,"<>")=0,"待填写BOM",IF(COUNTIFS(${bom}!$Q$5:$Q$34,"是",${bom}!$C$5:$C$34,"<>",${bom}!$R$5:$R$34,"<>confirmed")>0,"BOM待确认",IF(${cost}!J${5 + i}<>"confirmed","成本待确认",IF(OR(O${r}="",NOT(ISNUMBER(P${r})),P${r}<0,AND(O${r}="margin",P${r}>=1)),"利润规则待确认","可报价")))))`]];
  }
  sheet.getRange("B6:B10").setNumberFormat("#,##0");
  sheet.getRange("C6:V10").setNumberFormat("#,##0.00");
  sheet.getRange("P6:P10").setNumberFormat("0.0%");
  sheet.getRange("R6:R10").setNumberFormat("0.0%");
  sheet.getRange("W6:W10").conditionalFormats.add("containsText", { text: "可报价", format: { fill: COLOR.calc, font: { bold: true, color: "#1E4D1E" } } });
  sheet.getRange("W6:W10").conditionalFormats.add("notContainsText", { text: "可报价", format: { fill: COLOR.warning, font: { bold: true, color: "#9C0006" } } });
}

function writeFactoryQuote(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [12, 14, 17, 17, 17, 17, 17, 16, 18, 16, 18, 30]);
  sectionTitle(sheet, "A1:L1", "生产报价回填", "生产报价需注明税费、运费、MOQ、交期和有效期；不得混入客户售价或供应商比较。");
  tableHeader(sheet, "A4:L4", ["阶梯", "数量", "工厂单价", "税费口径", "运费口径", "样衣费", "MOQ", "大货周期", "报价日期", "有效期至", "状态", "备注"]);
  const tiers = data.order?.quantityTiers || [];
  const rows = Array.from({ length: 5 }, (_, i) => [`阶梯${i + 1}`, valueOrBlank(tiers[i]), "", "", "", "", "", "", "", "", "pending", ""]);
  sheet.getRange("A5:L9").values = rows;
  bodyFormat(sheet, "A5:L9", { height: 38 });
  inputFormat(sheet, "B5:L9");
  sheet.getRange("B5:C9").setNumberFormat("#,##0.00");
  sheet.getRange("K5:K9").dataValidation = { rule: { type: "list", values: ["confirmed", "provisional", "missing", "stale"] } };
}

function writeChecks(sheet, data, validation, internal) {
  baseSheet(sheet);
  setWidths(sheet, [12, 22, 45, 15, 50]);
  sectionTitle(sheet, "A1:E1", "发布检查", "阻断项未清零前只能标记为草稿或待确认。此页用于审核，不参与成本计算。");
  tableHeader(sheet, "A4:E4", ["级别", "代码", "检查项", "状态", "处理要求"]);
  const issues = validation.issues.map((x) => [x.level === "error" ? "阻断" : "提醒", x.code, x.path, "未完成", x.message]);
  const baseRows = issues.length ? issues : [["通过", "", "结构检查", "完成", "当前输入未发现结构阻断"]];
  sheet.getRange("A5:E34").values = padRows(baseRows, 30, 5);
  bodyFormat(sheet, "A5:E34", { height: 34 });
  sheet.getRange("A5:E34").conditionalFormats.add("containsText", { text: "阻断", format: { fill: COLOR.warning, font: { bold: true, color: "#9C0006" } } });
  sheet.getRange("A5:E34").conditionalFormats.add("containsText", { text: "通过", format: { fill: COLOR.calc, font: { bold: true, color: "#1E4D1E" } } });
  if (internal) {
    sheet.getRange("A36:E38").merge();
    sheet.getRange("A36").values = [["客户报价还需要：确认BOM单价/用量/MOQ、每个阶梯的车缝和工艺成本、利润方法、税费及报价有效期。目标成本和零售价不得替代成本输入。"]];
    sheet.getRange("A36:E38").format = { fill: COLOR.paleBlue, font: { name: FONT, size: 9, color: COLOR.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
  }
}

function writeRevisions(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [15, 16, 17, 20, 45, 22, 22, 30]);
  sectionTitle(sheet, "A1:H1", "变更记录 / REVISION LOG", "每次发布必须增加版本并记录变化、责任人和批准人；仅使用最新批准版本。");
  tableHeader(sheet, "A4:H4", ["版本", "日期", "变更类型", "变更页面/字段", "变更说明", "提出人", "批准人", "附件/备注"]);
  const rows = (data.revisions || []).map((r) => [r.version || "", r.date || "", r.type || "", r.section || "", r.description || "", r.author || "", r.approver || "", r.note || ""]);
  sheet.getRange("A5:H24").values = padRows(rows, 20, 8);
  bodyFormat(sheet, "A5:H24", { height: 36 });
  inputFormat(sheet, "A5:H24");
}

function writeSources(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [15, 24, 44, 15, 28, 48]);
  sectionTitle(sheet, "A1:F1", "来源与附件索引", "保留原始文件名和定位；正式文件只显示必要附件名，不暴露绝对路径或研究笔记。");
  tableHeader(sheet, "A4:F4", ["来源ID", "类型", "文件/URL", "角色", "定位", "说明"]);
  const rows = (data.sources || []).map((r) => [r.id || "", r.type || "", r.url || (r.path ? path.basename(r.path) : ""), r.role || "evidence", r.locator || "", r.note || ""]);
  sheet.getRange("A5:F34").values = padRows(rows, 30, 6);
  bodyFormat(sheet, "A5:F34", { height: 38 });
  inputFormat(sheet, "A5:F34");
}

function findRequirement(data, id) {
  return (data.requirements || []).find((x) => x.id === id)?.value ?? "";
}

async function writeFormalCover(sheet, data, logoPath) {
  baseSheet(sheet);
  setWidths(sheet, [15, 20, 20, 4, 15, 20, 20, 4, 15, 20, 20, 20, 20]);
  sheet.getRange("A1:M3").format.rowHeight = 24;
  const o = data.order || {};
  const producerBrand = o.producerBrand || "";
  await addLogo(sheet, logoPath || o.producerLogoPath, producerBrand);
  await addBrandLogo(sheet, o.brandLogoPath, o.brand || "");
  sheet.getRange("D1:I2").merge();
  sheet.getRange("D1").values = [[o.documentTitle || "服装工艺单"]];
  sheet.getRange("D1:I2").format = {
    font: { name: FONT, size: 18, bold: true, color: COLOR.navy },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.getRange("D3:I3").merge();
  sheet.getRange("D3").values = [[o.brand ? `品牌：${valueOrBlank(o.brand)}` : ""]];
  sheet.getRange("D3:I3").format = { font: { name: FONT, size: 9, bold: true, color: COLOR.mid }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.getRange("A4:M4").merge();
  sheet.getRange("A4").values = [["TECHNICAL SPECIFICATION"]];
  sheet.getRange("A4:M4").format = {
    fill: COLOR.navy,
    font: { name: FONT, size: 10, bold: true, color: COLOR.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: COLOR.navy },
  };
  const rows = [
    ["款号", valueOrBlank(o.styleNo || o.orderId), "", "", "产品名称", valueOrBlank(o.productName), "", "", "品牌", valueOrBlank(o.brand), "", "", ""],
    ["目标市场", valueOrBlank(o.market), "", "", "基础尺码", valueOrBlank(o.baseSize), "", "", "尺码范围", valueOrBlank(o.sizeRange), "", "", ""],
    ["上架平台", valueOrBlank(o.salesPlatform || ""), "", "", "面料编号与名称", valueOrBlank(o.fabricDisplay || [data.fabricDetail?.code, data.fabricDetail?.name].filter(Boolean).join(" / ") || [findRequirement(data, "REQ-003"), findRequirement(data, "REQ-004")].filter(Boolean).join(" / ")), "", "", "面料克重", `${valueOrBlank(data.fabricDetail?.gsm || findRequirement(data, "REQ-006"))} GSM`, "", "", ""],
    ["面料成分", valueOrBlank(data.fabricDetail?.composition || findRequirement(data, "REQ-005")), "", "", "面料幅宽", `${valueOrBlank(data.fabricDetail?.usableWidth || findRequirement(data, "REQ-007"))} cm`, "", "", "款式定位", valueOrBlank(o.stylePositioning), "", "", ""],
    ["产品组成", valueOrBlank(o.productComposition || o.productName), "", "", "颜色方式", o.colorPolicy === "active-development" ? "开发定色" : "供应商固定原色", "", "", "颜色确认", o.colorPolicy === "active-development" ? "按已批准实物色卡或Lab Dip确认" : "按原面料实物色卡及对应潘通编号确认", "", "", ""],
  ];
  sheet.getRange("A6:M10").values = rows;
  bodyFormat(sheet, "A6:M10", { height: 38 });
  for (const col of ["A", "E", "I"]) labelFormat(sheet, `${col}6:${col}10`);
  sheet.getRange("A13:M15").merge();
  sheet.getRange("A13").values = [["尺寸单位为厘米。成衣尺寸以POM表为准；颜色量产前须核对原面料实物色卡与供应商提供的对应潘通编号。"]];
  sheet.getRange("A13:M15").format = {
    fill: COLOR.gray,
    font: { name: FONT, size: 10, color: COLOR.ink },
    wrapText: true,
    verticalAlignment: "center",
    horizontalAlignment: "left",
    borders: { preset: "outside", style: "thin", color: COLOR.border },
  };
}

async function writeFormalVisual(sheet, data, kind) {
  baseSheet(sheet);
  setWidths(sheet, Array(12).fill(18));
  const isDesign = kind === "design";
  sectionTitle(sheet, "A1:L1", isDesign ? "设计效果图" : "技术三视图");
  const entries = isDesign ? (data.visuals?.designRenders || []) : (data.visuals?.technicalViews || []);
  const slots = isDesign ? 1 : 3;
  const slotRanges = isDesign
    ? [["A4:L28", 0]]
    : [["A4:D28", 0], ["E4:H28", 4], ["I4:L28", 8]];
  const labels = isDesign ? ["款式效果示意"] : ["正面", "侧面", "背面"];
  for (let i = 0; i < slots; i += 1) {
    const [range, col] = slotRanges[i];
    sheet.getRange(range).merge();
    sheet.getRange(range).format = {
      fill: COLOR.gray,
      borders: { preset: "outside", style: "thin", color: COLOR.border },
      horizontalAlignment: "center",
      verticalAlignment: "center",
    };
    const entry = entries[i];
    if (entry?.path) {
      try {
        const dataUrl = await fileDataUrl(entry.path);
        sheet.images.add({ dataUrl, anchor: { from: { row: 3, col }, extent: { widthPx: isDesign ? 920 : 300, heightPx: 500 } } });
      } catch {
        sheet.getRange(range.split(":")[0]).values = [[labels[i]]];
      }
    } else {
      sheet.getRange(range.split(":")[0]).values = [[labels[i]]];
    }
  }
  const labelRanges = isDesign ? [["A30:L31", "A30"]] : [["A30:D31", "A30"], ["E30:H31", "E30"], ["I30:L31", "I30"]];
  for (let i = 0; i < labelRanges.length; i += 1) {
    const [range, cell] = labelRanges[i];
    sheet.getRange(range).merge();
    sheet.getRange(cell).values = [[labels[i]]];
    sheet.getRange(range).format = {
      fill: COLOR.paleBlue,
      font: { name: FONT, size: 10, bold: true, color: COLOR.ink },
      horizontalAlignment: "center",
      verticalAlignment: "center",
      borders: { preset: "outside", style: "thin", color: COLOR.border },
    };
  }
  if (!isDesign) {
    const review = data.technicalReview || {};
    sheet.getRange("A34:L36").merge();
    sheet.getRange("A34").values = [[`设计核心要点：${review.designCore || "待填写"}`]];
    sheet.getRange("A34:L36").format = {
      fill: COLOR.gray,
      font: { name: FONT, size: 9, bold: true, color: COLOR.ink },
      wrapText: true,
      verticalAlignment: "center",
      borders: { preset: "outside", style: "thin", color: COLOR.border },
    };
    sheet.getRange("D38:L38").merge();
    sheet.getRange("A38:D38").values = [["序号", "修改部位", "当前要求/检查点", "快速填写修改意见"]];
    sheet.getRange("A38:L38").format = {
      fill: COLOR.blue,
      font: { name: FONT, size: 9, bold: true, color: COLOR.white },
      horizontalAlignment: "center",
      verticalAlignment: "center",
      wrapText: true,
      borders: { preset: "all", style: "thin", color: COLOR.white },
    };
    const quickRows = (review.quickEdits || []).slice(0, 4).map((item, index) => [
      item.id || `R${index + 1}`,
      item.area || "",
      item.currentRequirement || "",
      item.suggestedChange || "",
    ]);
    sheet.getRange("A39:L42").values = padRows(quickRows, 4, 12).map((row) => [row[0], row[1], row[2], row[3], "", "", "", "", "", "", "", ""]);
    for (let row = 39; row <= 42; row += 1) {
      sheet.getRange(`D${row}:L${row}`).merge();
    }
    bodyFormat(sheet, "A39:L42", { height: 38 });
  }
}

function writeFormalColors(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [14, 24, 24, 30, 27, 20, 42, 30]);
  const fixed = data.order?.colorPolicy !== "active-development";
  sectionTitle(sheet, "A1:H1", "颜色标准", fixed ? "固定原色以供应商实物色卡为准；没有证据时不得根据屏幕图猜测潘通编号。" : "开发色以FHI TCX目标及已批准实物色卡或Lab Dip为准；屏幕色仅作预览。");
  tableHeader(sheet, "A4:H4", ["色号", "颜色名称", "使用部位", "面料", "潘通/原色编号", "体系", "实物颜色标准", "确认要求"]);
  const rows = (data.colorways || []).map((r) => [
    r.colorwayId || "",
    r.name || "",
    r.component || "",
    r.material || "",
    r.pantoneCode || (fixed ? "待供应商提供原面料对应潘通编号" : "待确定目标色号"),
    r.system || "FHI TCX（待确认）",
    r.physicalStandard || (fixed ? "原面料实物色卡" : "待提交实物色卡/Lab Dip"),
    r.labDipStatus === "已批准" ? "已确认" : (fixed ? "生产前核对原色卡与潘通编号" : "生产前完成Lab Dip批准"),
  ]);
  sheet.getRange("A5:H14").values = padRows(rows, 10, 8);
  bodyFormat(sheet, "A5:H14", { height: 46 });
}

function writeFormalBom(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [12, 16, 23, 24, 50, 20, 34, 12, 15]);
  sectionTitle(sheet, "A1:I1", "物料清单（BOM）");
  tableHeader(sheet, "A4:I4", ["行号", "类别", "部件", "位置", "完整规格", "物料编码", "颜色/潘通", "单位", "单件用量"]);
  const rows = (data.bom || []).map((r) => [
    r.lineId || "", r.category || "", r.component || "", r.placement || "", r.spec || "", r.materialCode || "",
    String(r.colorRef || "").replace(/PANTONE 14-1116 TCX \/ CW-02 PANTONE 14-4102 TCX；均为建议目标，Lab Dip待批/, "按CW-01/CW-02原面料色卡及对应潘通编号"),
    r.unit || "", valueOrBlank(r.consumption),
  ]);
  sheet.getRange("A5:I29").values = padRows(rows, 25, 9);
  bodyFormat(sheet, "A5:I29", { height: 42 });
  sheet.getRange("I5:I29").setNumberFormat("0.000");
}

function writeFormalPom(sheet, data, sizes) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  const sizeStart = 7;
  const sizeCols = sizes.map((_, i) => String.fromCharCode(65 + sizeStart + i));
  const endCol = sizeCols.at(-1) || "H";
  setWidths(sheet, [13, 24, 48, 11, 12, 12, 4, ...sizes.map(() => 15)]);
  sectionTitle(sheet, `A1:${endCol}1`, "成衣尺寸、POM与公差", `${data.order?.market || "目标市场"} ${sizes.join("/")}；以下为成衣尺寸。人体净尺寸与成衣尺寸必须分开管理，半围/全围按测量方法执行。`);
  tableHeader(sheet, `A4:${endCol}4`, ["POM", "测量部位", "测量方法", "单位", "公差+", "公差-", "", ...sizes]);
  const rows = (data.pom || []).map((r) => [
    r.pomId || "", r.nameCn || "", r.measurementMethod || "", r.unit || "", valueOrBlank(r.tolerancePlus), valueOrBlank(r.toleranceMinus), "",
    ...sizes.map((s) => valueOrBlank(r.values?.[s])),
  ]);
  sheet.getRange(`A5:${endCol}32`).values = padRows(rows, 28, 7 + sizes.length);
  bodyFormat(sheet, `A5:${endCol}32`, { height: 36 });
  sheet.getRange("G4:G32").clear({ applyTo: "all" });
  sheet.getRange("E5:F32").setNumberFormat("0.0");
  for (const col of sizeCols) sheet.getRange(`${col}5:${col}32`).setNumberFormat("0.0");
}

function writeFormalConstruction(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [13, 20, 46, 18, 18, 12, 16, 23, 22, 44]);
  sectionTitle(sheet, "A1:J1", "车缝结构与工艺");
  tableHeader(sheet, "A4:J4", ["工序ID", "部位", "工艺说明", "缝型", "线迹类型", "针距/SPI", "缝份", "线材/线色", "设备", "质量要求"]);
  const rows = (data.construction || []).map((r) => [r.operationId || "", r.area || "", r.operation || "", r.seamType || "", r.stitchType || "", valueOrBlank(r.spi), r.seamAllowance || "", r.thread || "", r.machine || "", r.qualityNote || ""]);
  sheet.getRange("A5:J29").values = padRows(rows, 25, 10);
  bodyFormat(sheet, "A5:J29", { height: 44 });
}

function writeFormalArtworkPack(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [13, 22, 20, 28, 12, 12, 10, 12, 36]);
  sectionTitle(sheet, "A1:I1", "图稿、标签与包装");
  tableHeader(sheet, "A4:I4", ["图稿ID", "名称", "工艺", "位置", "宽", "高", "单位", "颜色数", "文件/比例"]);
  const art = (data.artwork || []).map((r) => [r.artworkId || "", r.name || "", r.technique || "", r.placement || "", valueOrBlank(r.width), valueOrBlank(r.height), r.unit || "", valueOrBlank(r.colorCount), [r.fileRef, r.scale].filter(Boolean).join(" / ")]);
  sheet.getRange("A5:I13").values = padRows(art, 9, 9);
  bodyFormat(sheet, "A5:I13", { height: 38 });
  tableHeader(sheet, "A16:I16", ["项目ID", "类别", "项目", "规格", "位置", "单位", "单件数量", "图稿引用", "生产备注"]);
  const pack = (data.labelsPackaging || []).map((r) => [r.itemId || "", r.category || "", r.item || "", r.spec || "", r.placement || "", r.unit || "", valueOrBlank(r.quantityPerPiece), r.artworkRef || "", "按确认样执行"]);
  sheet.getRange("A17:I31").values = padRows(pack, 15, 9);
  bodyFormat(sheet, "A17:I31", { height: 42 });
}

async function writeFormalLabelPlacement(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, Array(12).fill(18));
  sectionTitle(sheet, "A1:L1", "标签位置参考图");
  const entries = (data.labelsPackaging || []).filter((r) => r.placementImage).slice(0, 4);
  const slotCount = entries.length <= 2 ? 2 : 4;
  const ranges = [["A4:F17", 0, 3], ["G4:L17", 6, 3], ["A22:F35", 0, 21], ["G22:L35", 6, 21]];
  const labelRanges = [["A18:F20", "A18"], ["G18:L20", "G18"], ["A36:F38", "A36"], ["G36:L38", "G36"]];
  for (let i = 0; i < slotCount; i += 1) {
    const [range, col, row] = ranges[i];
    sheet.getRange(range).merge();
    sheet.getRange(range).format = { fill: COLOR.gray, borders: { preset: "outside", style: "thin", color: COLOR.border }, horizontalAlignment: "center", verticalAlignment: "center" };
    const entry = entries[i];
    if (entry?.placementImage) {
      try {
        const dataUrl = await fileDataUrl(entry.placementImage);
        sheet.images.add({ dataUrl, anchor: { from: { row, col }, extent: { widthPx: 445, heightPx: 255 } } });
      } catch {
        sheet.getRange(range.split(":")[0]).values = [[entry.item || "标签位置"]];
      }
    }
    const [labelRange, labelCell] = labelRanges[i];
    sheet.getRange(labelRange).merge();
    sheet.getRange(labelCell).values = [[entry ? `${entry.item || ""}\n${entry.placement || ""}` : ""]];
    sheet.getRange(labelRange).format = { fill: COLOR.paleBlue, font: { name: FONT, size: 9, bold: true, color: COLOR.ink }, wrapText: true, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
  }
  const footerRange = slotCount === 2 ? "A22:L24" : "A40:L42";
  const footerCell = slotCount === 2 ? "A22" : "A40";
  sheet.getRange(footerRange).merge();
  sheet.getRange(footerCell).values = [["位置尺寸以成品缝线为基准。标签须平服、牢固、不得外露或直接刺激皮肤；最终内容与版式按客户批准稿执行。"]];
  sheet.getRange(footerRange).format = { fill: COLOR.gray, font: { name: FONT, size: 9, color: COLOR.ink }, wrapText: true, horizontalAlignment: "left", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
}

function writeFormalTesting(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  setWidths(sheet, [13, 22, 30, 38, 58, 44, 24, 22]);
  sectionTitle(sheet, "A1:H1", "测试、合规与质量要求");
  tableHeader(sheet, "A4:H4", ["测试ID", "适用市场", "材料/产品", "标准/法规", "要求", "方法", "报告编号", "结果"]);
  const rows = (data.testing || []).map((r) => [r.testId || "", r.market || "", r.materialOrProduct || "", r.standard || "", r.requirement || "", r.method || "", r.reportId || "", r.result || ""]);
  sheet.getRange("A5:H24").values = padRows(rows, 20, 8);
  bodyFormat(sheet, "A5:H24", { height: 48 });
}

function writeFormalMarketBenchmark(sheet, data) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(4);
  const market = data.marketBenchmark || {};
  const platform = market.primaryPlatform || data.order?.salesPlatform || "主要销售平台";
  setWidths(sheet, [16, 24, 42, 20, 24, 22, 40, 48, 30, 18, 18]);
  sectionTitle(sheet, "A1:K1", "市场对标、尺码分析与首测配码", `核心平台：${platform}；数据日期：${market.capturedAt || "待填写"}。公开价格、排名、评论和购买标识会随时间及商品变体变化。`);
  tableHeader(sheet, "A4:I4", ["平台/品牌", "商品/款号", "同类款", "价格", "评分/评论", "公开需求信号", "尺码范围", "面料/合身反馈", "来源"]);
  const comps = (market.comparables || []).map((r) => [
    [r.platform, r.brand].filter(Boolean).join(" / "), r.sku || r.asin || "", r.product || "",
    r.priceDisplay || [r.currency, r.price].filter(Boolean).join(" "),
    [r.rating ? `${r.rating}分` : "", r.reviewCount ? `${r.reviewCount}条评论` : ""].filter(Boolean).join(" / "),
    r.salesSignal || "", r.sizeRange || "", [r.material, r.fitInsight].filter(Boolean).join("；"), r.sourceLabel || r.sourceUrl || "",
  ]);
  sheet.getRange("A5:I10").values = padRows(comps, 6, 9);
  bodyFormat(sheet, "A5:I10", { height: 50 });

  tableHeader(sheet, "A13:I13", ["尺码", "对应数字码", "胸围(in)", "胸围(cm)", "腰围(in)", "腰围(cm)", "臀围(in)", "臀围(cm)", "数据属性/来源"]);
  const sizeRows = (market.sizeBodyReference || data.sizeBasis?.bodyRows || []).map((r) => [
    r.size || "", r.usNumeric || r.numeric || "", r.bustIn || "", r.bustCm || "", r.waistIn || "", r.waistCm || "", r.hipIn || "", r.hipCm || "", [r.dataType || "人体净尺寸参考", r.sourceLabel].filter(Boolean).join(" / "),
  ]);
  sheet.getRange("A14:I19").values = padRows(sizeRows, 6, 9);
  bodyFormat(sheet, "A14:I19", { height: 30 });

  const sizes = parseSizes(data.order || {}).slice(0, 6);
  const endCol = String.fromCharCode(65 + 4 + sizes.length);
  tableHeader(sheet, `A22:${endCol}22`, ["颜色", "颜色属性", "每色数量", ...sizes, "合计", "建议依据"]);
  const matrices = (market.testAllocationByColor || []).map((r) => {
    const sizeValues = sizes.map((size) => Number(r.unitsBySize?.[size]) || 0);
    return [r.color || "", r.classification || "", valueOrBlank(r.unitsPerColor), ...sizeValues, sizeValues.reduce((sum, value) => sum + value, 0), r.rationale || ""];
  });
  sheet.getRange(`A23:${endCol}32`).values = padRows(matrices, 10, 5 + sizes.length);
  bodyFormat(sheet, `A23:${endCol}32`, { height: 34 });

  sheet.getRange("A35:K39").merge();
  sheet.getRange("A35").values = [[`口径说明：${market.methodNote || "公开页面不提供竞品按颜色与尺码的精确成交量；首测配码属于市场信号、版型与面料特性共同形成的测试建议。"}\n结论：${market.salesConclusion || ""}\n复盘指标：售罄率、售出用时、退换货方向、退货原因与断码率。`]];
  sheet.getRange("A35:K39").format = { fill: COLOR.gray, font: { name: FONT, size: 9, color: COLOR.ink }, wrapText: true, horizontalAlignment: "left", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: COLOR.border } };
}

function writeFormalProductCopy(sheet, data) {
  baseSheet(sheet);
  setWidths(sheet, [20, 58, 20, 58, 20, 40]);
  sectionTitle(sheet, "A1:F1", "面料信息、产品卖点与文案", "所有功能、环保、认证与性能表述必须有面料规格、测试报告或批准资料支持。");
  const fabric = data.fabricDetail || {};
  const fabricRows = [
    ["面料编号", fabric.code || "", "商业名称", fabric.name || "", "系列", fabric.series || ""],
    ["成分", fabric.composition || findRequirement(data, "REQ-005"), "克重", valueOrBlank(fabric.gsm || findRequirement(data, "REQ-006")), "可用幅宽", valueOrBlank(fabric.usableWidth || findRequirement(data, "REQ-007"))],
    ["结构/手感", [fabric.structure, fabric.handFeel].filter(Boolean).join("；"), "弹性/回复", [fabric.stretch, fabric.recovery].filter(Boolean).join("；"), "现货颜色", (fabric.stockColors || []).join("、")],
    ["适用季节", fabric.season || "", "护理提示", fabric.care || "", "证据状态", fabric.status || "pending"],
  ];
  sheet.getRange("A4:F7").values = fabricRows;
  bodyFormat(sheet, "A4:F7", { height: 42 });
  for (const col of ["A", "C", "E"]) labelFormat(sheet, `${col}4:${col}7`);

  tableHeader(sheet, "A10:E10", ["类型", "内容", "依据", "使用场景", "状态"]);
  const copy = data.copywriting || {};
  const rows = [];
  for (const item of copy.sellingPoints || []) rows.push(["产品卖点", item.text || item, item.evidence || "", item.channel || "商品页", item.status || "pending"]);
  if (copy.shortCopy) rows.push(["短文案", copy.shortCopy, copy.copyBasis || "", copy.shortCopyChannel || "列表页/社媒", copy.status || "pending"]);
  if (copy.longCopy) rows.push(["长文案", copy.longCopy, copy.copyBasis || "", copy.longCopyChannel || "详情页/独立站", copy.status || "pending"]);
  if ((copy.keywords || []).length) rows.push(["关键词", copy.keywords.join("；"), copy.keywordBasis || "", copy.keywordChannel || "检索/商品页", copy.status || "pending"]);
  sheet.getRange("A11:E22").values = padRows(rows, 12, 5);
  bodyFormat(sheet, "A11:E22", { height: 44 });
}

async function buildWorkbook(data, logoPath) {
  const wb = Workbook.create();
  const sizes = parseSizes(data.order || {});
  await writeFormalCover(wb.worksheets.add("01_款式资料"), data, logoPath);
  await writeFormalVisual(wb.worksheets.add("02_设计效果图"), data, "design");
  await writeFormalVisual(wb.worksheets.add("03_技术三视图"), data, "technical");
  writeFormalColors(wb.worksheets.add("04_颜色标准"), data);
  writeFormalBom(wb.worksheets.add("05_物料清单"), data);
  writeFormalPom(wb.worksheets.add("06_成衣尺寸"), data, sizes);
  writeFormalConstruction(wb.worksheets.add("07_车缝工艺"), data);
  writeFormalArtworkPack(wb.worksheets.add("08_图稿标签包装"), data);
  await writeFormalLabelPlacement(wb.worksheets.add("09_标签位置参考图"), data);
  writeFormalTesting(wb.worksheets.add("10_测试与质量"), data);
  writeFormalProductCopy(wb.worksheets.add("11_面料与产品文案"), data);
  if (data.deliverables?.includeMarketPage !== false) writeFormalMarketBenchmark(wb.worksheets.add("12_市场对标与配码"), data);
  writeRevisions(wb.worksheets.add("13_变更记录"), data);
  wb.recalculate();
  return wb;
}

async function renderWorkbook(wb, dir, prefix) {
  await fs.mkdir(dir, { recursive: true });
  for (let i = 0; i < wb.worksheets.items.length; i += 1) {
    const sheet = wb.worksheets.getItemAt(i);
    const image = await wb.render({ sheetName: sheet.name, autoCrop: "all", scale: 0.9, format: "png" });
    const safe = `${String(i + 1).padStart(2, "0")}_${sheet.name.replace(/[\\/:*?"<>|]/g, "-")}`;
    await fs.writeFile(path.join(dir, `${prefix}_${safe}.png`), new Uint8Array(await image.arrayBuffer()));
  }
}

async function scanErrors(wb, label) {
  const check = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 100 }, summary: `${label} formula error scan` });
  console.log(check.ndjson);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = JSON.parse(await fs.readFile(args.input, "utf8"));
  const validation = validateTechpackInput(data, args.mode);
  if (args.mode === "finalize" && !validation.valid) throw new Error(`Finalize blocked: ${validation.issues.filter((x) => x.level === "error").length} errors`);
  const workbook = await buildWorkbook(data, args.logo);
  await scanErrors(workbook, "formal-techpack");
  await fs.mkdir(args.outputDir, { recursive: true });
  const orderId = cleanName(data.order?.styleNo || data.order?.orderId || "TECHPACK-TEMPLATE");
  const fileBrand = cleanName(data.order?.fileBrand || data.order?.producerBrand || data.order?.brand || "APPAREL");
  const outputPath = path.join(args.outputDir, `${orderId}_${fileBrand}工艺单.xlsx`);
  const file = await SpreadsheetFile.exportXlsx(workbook);
  await file.save(outputPath);
  if (args.renderDir) {
    await renderWorkbook(workbook, args.renderDir, "formal");
  }
  console.log(JSON.stringify({ outputPath, validation }, null, 2));
}

main();
