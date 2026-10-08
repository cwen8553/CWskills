#!/usr/bin/env node
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const present = (value) => value !== null && value !== undefined && String(value).trim() !== "";
const finite = (value) => typeof value === "number" && Number.isFinite(value);

export function validateTechpackInput(data, mode = "draft") {
  const issues = [];
  const add = (level, code, path, message) => issues.push({ level, code, path, message });
  const finalLevel = () => mode === "finalize" ? "error" : "warning";

  if (!data || typeof data !== "object") {
    return { valid: false, mode, blockingCount: 1, warningCount: 0, issues: [{ level: "error", code: "INVALID_ROOT", path: "$", message: "输入必须是JSON对象" }] };
  }
  if (data.schemaVersion !== "2.0") add("error", "SCHEMA_VERSION", "schemaVersion", "schemaVersion必须为2.0");

  const order = data.order || {};
  for (const key of ["orderId", "styleNo", "productName", "brand", "market", "owner", "version", "baseSize"]) {
    if (!present(order[key])) add("error", "ORDER_REQUIRED", `order.${key}`, `缺少${key}`);
  }
  if (!Array.isArray(order.sizes) || !order.sizes.length) add("error", "SIZE_SET_MISSING", "order.sizes", "缺少尺码范围");

  const views = data.visuals?.technicalViews || [];
  for (const [view, label] of [["front", "正面"], ["back", "背面"]]) {
    const match = views.find((item) => item.view === view && present(item.path));
    if (!match) add("error", "VIEW_MISSING", `visuals.technicalViews.${view}`, `缺少${label}技术图`);
    else if (mode === "finalize" && match.status !== "approved") add("error", "VIEW_UNAPPROVED", `visuals.technicalViews.${view}.status`, `${label}技术图尚未批准`);
  }
  if (data.technicalReview?.sideViewRequired && !views.some((item) => item.view === "side" && present(item.path))) {
    add("error", "SIDE_VIEW_MISSING", "visuals.technicalViews.side", "该结构要求侧面技术图");
  }

  const colors = data.colorways || [];
  if (!colors.length) add("error", "COLOR_MISSING", "colorways", "缺少颜色方案");
  colors.forEach((row, index) => {
    if (!present(row.name) || !present(row.component) || !present(row.material)) add("error", "COLOR_TECH_MISSING", `colorways[${index}]`, "颜色缺少名称、部件或材质");
    const fixed = order.colorPolicy === "fixed-original";
    if (fixed && !present(row.physicalStandard)) add(finalLevel(), "COLOR_PHYSICAL_STANDARD", `colorways[${index}].physicalStandard`, "固定原色缺少实物色卡依据");
    if (!fixed && (!present(row.pantoneCode) || !present(row.system))) add(finalLevel(), "COLOR_STANDARD", `colorways[${index}]`, "开发色缺少潘通代码或体系");
    if (mode === "finalize" && row.status !== "confirmed") add("error", "COLOR_UNCONFIRMED", `colorways[${index}].status`, "颜色尚未确认");
  });

  const bom = data.bom || [];
  if (!bom.some((row) => row.category === "主面料")) add("error", "MAIN_FABRIC_MISSING", "bom", "缺少主面料BOM");
  bom.forEach((row, index) => {
    if (![row.component, row.placement, row.spec, row.unit].every(present)) add("error", "BOM_TECH_MISSING", `bom[${index}]`, "BOM缺少部件、位置、规格或单位");
    if (mode === "finalize" && !["confirmed", "na"].includes(row.status)) add("error", "BOM_UNCONFIRMED", `bom[${index}].status`, "BOM存在未确认项");
    if (present(row.consumption) && !finite(row.consumption)) add("error", "BOM_CONSUMPTION", `bom[${index}].consumption`, "单件用量必须是数值或留空待确认");
  });

  const pom = data.pom || [];
  if (!pom.length) add("error", "POM_MISSING", "pom", "缺少POM尺寸表");
  pom.forEach((row, index) => {
    if (!present(row.pomId) || !present(row.measurementMethod) || !present(row.unit) || !finite(row.tolerancePlus) || !finite(row.toleranceMinus)) {
      add("error", "POM_TECH_MISSING", `pom[${index}]`, "POM缺少编号、测量方法、单位或公差");
    }
    if (mode === "finalize" && row.status !== "confirmed") add("error", "POM_UNCONFIRMED", `pom[${index}].status`, "POM尚未确认");
    if (mode === "finalize") {
      for (const size of order.sizes || []) {
        if (!finite(row.values?.[size])) add("error", "POM_SIZE_VALUE", `pom[${index}].values.${size}`, `POM缺少${size}数值`);
      }
    }
  });

  const construction = data.construction || [];
  if (!construction.length) add("error", "CONSTRUCTION_MISSING", "construction", "缺少车缝工艺");
  if (mode === "finalize" && construction.some((row) => row.status !== "confirmed")) add("error", "CONSTRUCTION_UNCONFIRMED", "construction", "车缝工艺存在未确认项");

  const labels = data.labelsPackaging || [];
  if (!labels.length) add(finalLevel(), "LABEL_PACK_MISSING", "labelsPackaging", "缺少标签与包装信息");
  if (mode === "finalize" && labels.some((row) => !["confirmed", "na"].includes(row.status))) add("error", "LABEL_PACK_UNCONFIRMED", "labelsPackaging", "标签或包装存在未确认项");
  if (mode === "finalize" && labels.some((row) => ["主标", "尺码标", "水洗标", "care-label", "main-label"].includes(row.category || row.item)) && !labels.some((row) => present(row.placementImage))) {
    add("error", "LABEL_PLACEMENT_IMAGE", "labelsPackaging", "正式版缺少衣标/水洗标位置参考图");
  }

  const review = data.technicalReview || {};
  if (!present(review.designCore)) add(finalLevel(), "DESIGN_CORE_MISSING", "technicalReview.designCore", "缺少设计核心要点");
  if (!Array.isArray(review.quickEdits) || review.quickEdits.length < 4) add(finalLevel(), "QUICK_EDIT_MISSING", "technicalReview.quickEdits", "至少需要四条可编辑修改意见");

  const market = data.marketBenchmark || {};
  if (data.deliverables?.includeMarketPage) {
    if (!present(market.capturedAt) || !Array.isArray(market.comparables) || !market.comparables.length) add(finalLevel(), "MARKET_EVIDENCE_MISSING", "marketBenchmark", "市场页缺少抓取日期或对标产品");
    const matrices = market.testAllocationByColor || [];
    if (!matrices.length) add(finalLevel(), "ALLOCATION_MISSING", "marketBenchmark.testAllocationByColor", "市场页缺少按颜色和尺码的首测矩阵");
    for (const [index, matrix] of matrices.entries()) {
      const total = Object.values(matrix.unitsBySize || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
      if (Number.isFinite(matrix.unitsPerColor) && total !== matrix.unitsPerColor) add("error", "ALLOCATION_TOTAL", `marketBenchmark.testAllocationByColor[${index}]`, `颜色${matrix.color || index + 1}的尺码合计${total}不等于${matrix.unitsPerColor}`);
    }
  }

  const currentRevision = (data.revisions || []).find((row) => row.version === order.version);
  if (mode === "finalize" && (!currentRevision || !present(currentRevision.approver))) add("error", "REVISION_APPROVAL", "revisions", "当前版本缺少批准记录");

  const blockingCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter((issue) => issue.level === "warning").length;
  return { valid: blockingCount === 0, mode, blockingCount, warningCount, issues };
}

async function main() {
  const args = process.argv.slice(2);
  const inputAt = args.indexOf("--input");
  const modeAt = args.indexOf("--mode");
  if (inputAt < 0) throw new Error("Usage: validate_techpack_input.mjs --input order.json [--mode draft|finalize]");
  const mode = modeAt >= 0 ? args[modeAt + 1] : "draft";
  if (!["draft", "finalize"].includes(mode)) throw new Error("--mode must be draft or finalize");
  const data = JSON.parse(await fs.readFile(args[inputAt + 1], "utf8"));
  const result = validateTechpackInput(data, mode);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid && mode === "finalize") process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
