#!/usr/bin/env bash
set -euo pipefail

NODE_BIN="${NODE_BIN:-node}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$SKILL_DIR/tests/output}"
FONT_PATH="${FONT_PATH:-/System/Library/Fonts/Supplemental/Arial Unicode.ttf}"

mkdir -p "$OUT_DIR"
"$NODE_BIN" "$SKILL_DIR/scripts/validate_techpack_input.mjs" --input "$SKILL_DIR/tests/fixtures/minimal-draft.json" --mode draft
"$NODE_BIN" "$SKILL_DIR/scripts/build_techpack_workbook.mjs" --input "$SKILL_DIR/tests/fixtures/minimal-draft.json" --output-dir "$OUT_DIR" --render-dir "$OUT_DIR/render" --mode draft
"$PYTHON_BIN" "$SKILL_DIR/scripts/build_techpack_pdf.py" --input "$SKILL_DIR/tests/fixtures/minimal-draft.json" --output "$OUT_DIR/DEMO-001-T_DEMO工艺单.pdf" --font "$FONT_PATH"
"$NODE_BIN" "$SKILL_DIR/scripts/build_batch_index.mjs" --input "$SKILL_DIR/tests/fixtures/batch-manifest.json" --output "$OUT_DIR/工艺单管理总表.xlsx"
"$NODE_BIN" "$SKILL_DIR/scripts/build_cost_input_template.mjs" --input "$SKILL_DIR/tests/fixtures/batch-manifest.json" --output "$OUT_DIR/成本与大货信息填写表.xlsx"
