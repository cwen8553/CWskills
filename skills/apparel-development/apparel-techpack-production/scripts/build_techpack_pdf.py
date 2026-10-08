#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


BLACK = colors.HexColor("#111111")
DARK_GRAY = colors.HexColor("#333333")
MID_GRAY = colors.HexColor("#666666")
LIGHT_GRAY = colors.HexColor("#E8E8E8")
PALE_GRAY = colors.HexColor("#F5F5F5")
BORDER = colors.HexColor("#B8B8B8")
WHITE = colors.white


def clean(value):
    return "" if value is None else str(value)


def parse_sizes(order):
    values = order.get("sizes") or []
    if values:
        return [str(x) for x in values[:8]]
    return ["M", "L", "XL"]


def requirement(data, req_id):
    for item in data.get("requirements", []):
        if item.get("id") == req_id:
            return item.get("value", "")
    return ""


def padded(rows, count, width):
    rows = list(rows[:count])
    while len(rows) < count:
        rows.append([""] * width)
    return rows


def make_styles(font):
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=base["Title"], fontName=font, fontSize=23, leading=29, textColor=BLACK, alignment=TA_CENTER),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"], fontName=font, fontSize=10, leading=14, textColor=MID_GRAY, alignment=TA_CENTER),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName=font, fontSize=16, leading=20, textColor=BLACK, spaceAfter=6),
        "body": ParagraphStyle("body", parent=base["Normal"], fontName=font, fontSize=8, leading=11, textColor=BLACK),
        "small": ParagraphStyle("small", parent=base["Normal"], fontName=font, fontSize=6.5, leading=8.5, textColor=BLACK),
        "caption": ParagraphStyle("caption", parent=base["Normal"], fontName=font, fontSize=9, leading=12, textColor=BLACK, alignment=TA_CENTER),
    }


def p(value, style):
    text = clean(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    return Paragraph(text, style)


def make_table(rows, widths, font, body_size=6.4, header=True, row_heights=None):
    body = ParagraphStyle("tbl", fontName=font, fontSize=body_size, leading=body_size + 2, textColor=BLACK, alignment=TA_LEFT)
    head = ParagraphStyle("th", fontName=font, fontSize=body_size, leading=body_size + 2, textColor=WHITE, alignment=TA_CENTER)
    cooked = []
    for ri, row in enumerate(rows):
        cooked.append([p(x, head if header and ri == 0 else body) for x in row])
    tbl = Table(cooked, colWidths=widths, rowHeights=row_heights, repeatRows=1 if header else 0)
    rules = [
        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    if header:
        rules.extend([
            ("BACKGROUND", (0, 0), (-1, 0), DARK_GRAY),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ])
    tbl.setStyle(TableStyle(rules))
    return tbl


def page_decorator(canvas, doc, font, order):
    canvas.saveState()
    canvas.setFillColor(BLACK)
    canvas.rect(0, A4[0] - 9 * mm, landscape(A4)[0], 9 * mm, stroke=0, fill=1)
    canvas.setFont(font, 6.5)
    canvas.setFillColor(WHITE)
    producer = clean(order.get("producerBrand") or order.get("brand") or "APPAREL")
    canvas.drawString(10 * mm, A4[0] - 5.8 * mm, f"{producer} | {clean(order.get('styleNo') or order.get('orderId'))} | Rev {clean(order.get('version'))}")
    canvas.drawRightString(landscape(A4)[0] - 10 * mm, A4[0] - 5.8 * mm, f"Page {doc.page}")
    canvas.setStrokeColor(BORDER)
    canvas.line(10 * mm, 8 * mm, landscape(A4)[0] - 10 * mm, 8 * mm)
    canvas.restoreState()


def visual_cell(entry, width, height, font, label):
    file_path = entry.get("path") if entry else ""
    if file_path and Path(file_path).exists():
        return Image(file_path, width=width, height=height, kind="proportional")
    return p(label, ParagraphStyle("placeholder", fontName=font, fontSize=12, leading=16, textColor=MID_GRAY, alignment=TA_CENTER))


def build_story(data, logo_path, font, styles):
    order = data.get("order", {})
    story = []

    brand_logo_path = order.get("brandLogoPath")
    producer_name = clean(order.get("producerBrand") or "")
    producer_logo = Image(logo_path, width=62 * mm, height=14 * mm, kind="proportional") if logo_path and Path(logo_path).exists() else p(producer_name, styles["title"])
    brand_logo = Image(brand_logo_path, width=42 * mm, height=28 * mm, kind="proportional") if brand_logo_path and Path(brand_logo_path).exists() else p(clean(order.get("brand")), styles["subtitle"])
    title_block = [p(clean(order.get("documentTitle") or "服装工艺单"), styles["title"]), p("TECHNICAL SPECIFICATION", styles["subtitle"]), p(f"品牌：{clean(order.get('brand'))}", styles["subtitle"])]
    cover_brand = Table([[producer_logo, title_block, brand_logo]], colWidths=[70 * mm, 110 * mm, 58 * mm], rowHeights=[31 * mm])
    cover_brand.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2)]))
    story.extend([Spacer(1, 8 * mm), cover_brand])
    story.append(Spacer(1, 9 * mm))
    cover_rows = [
        ["款号", order.get("styleNo") or order.get("orderId"), "产品名称", order.get("productName"), "品牌", order.get("brand")],
        ["目标市场", order.get("market"), "基础尺码", order.get("baseSize"), "尺码范围", order.get("sizeRange")],
        ["上架平台", order.get("salesPlatform", ""), "面料编号与名称", order.get("fabricDisplay") or " / ".join(filter(None, [clean(data.get("fabricDetail", {}).get("code")), clean(data.get("fabricDetail", {}).get("name"))])) or " / ".join(filter(None, [clean(requirement(data, "REQ-003")), clean(requirement(data, "REQ-004"))])), "面料克重", f"{clean(data.get('fabricDetail', {}).get('gsm') or requirement(data, 'REQ-006'))} GSM"],
        ["面料成分", data.get("fabricDetail", {}).get("composition") or requirement(data, "REQ-005"), "面料幅宽", f"{clean(data.get('fabricDetail', {}).get('usableWidth') or requirement(data, 'REQ-007'))} cm", "款式定位", order.get("stylePositioning", "")],
        ["产品组成", order.get("productComposition", order.get("productName")), "颜色方式", "开发定色" if order.get("colorPolicy") == "active-development" else "供应商固定原色", "颜色确认", "按已批准实物色卡或Lab Dip确认" if order.get("colorPolicy") == "active-development" else "按原面料色卡及对应潘通编号确认"],
    ]
    story.append(make_table(cover_rows, [26 * mm, 50 * mm, 26 * mm, 50 * mm, 26 * mm, 60 * mm], font, body_size=8, header=False, row_heights=[12 * mm] * 5))
    story.append(Spacer(1, 8 * mm))
    note = Table([[p("尺寸单位为厘米。成衣尺寸以POM表为准；颜色量产前须核对原面料实物色卡与供应商提供的对应潘通编号。", styles["body"])]], colWidths=[238 * mm], rowHeights=[18 * mm])
    note.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE_GRAY), ("BOX", (0, 0), (-1, -1), 0.7, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 6)]))
    story.append(note)

    story.append(PageBreak())
    story.append(p("1. 设计效果图", styles["h1"]))
    design = data.get("visuals", {}).get("designRenders", [])
    design_table = Table([[visual_cell(design[0] if len(design) > 0 else {}, 210 * mm, 122 * mm, font, "款式效果示意")]], colWidths=[238 * mm], rowHeights=[132 * mm])
    design_table.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("BACKGROUND", (0, 0), (-1, -1), PALE_GRAY)]))
    story.append(design_table)
    story.append(Spacer(1, 3 * mm))
    story.append(make_table([["款式效果示意"]], [238 * mm], font, body_size=8.5, header=False, row_heights=[10 * mm]))

    story.append(PageBreak())
    story.append(p("2. 技术三视图", styles["h1"]))
    views = data.get("visuals", {}).get("technicalViews", [])
    by_view = {x.get("view"): x for x in views}
    view_table = Table([[visual_cell(by_view.get(v, {}), 72 * mm, 76 * mm, font, label) for v, label in [("front", "正面"), ("side", "侧面"), ("back", "背面")]]], colWidths=[79 * mm] * 3, rowHeights=[82 * mm])
    view_table.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("BACKGROUND", (0, 0), (-1, -1), PALE_GRAY)]))
    story.append(view_table)
    story.append(Spacer(1, 3 * mm))
    story.append(make_table([["正面", "侧面", "背面"]], [79 * mm] * 3, font, body_size=8.5, header=False, row_heights=[10 * mm]))
    story.append(Spacer(1, 4 * mm))
    review = data.get("technicalReview", {})
    story.append(make_table([[f"设计核心要点：{clean(review.get('designCore') or '待填写')}"]], [238 * mm], font, body_size=7.2, header=False, row_heights=[10 * mm]))
    edit_rows = [["序号", "修改部位", "当前要求/检查点", "快速填写修改意见"]]
    for index, item in enumerate((review.get("quickEdits") or [])[:4]):
        edit_rows.append([item.get("id") or f"R{index + 1}", item.get("area"), item.get("currentRequirement"), item.get("suggestedChange")])
    edit_rows = [edit_rows[0]] + padded(edit_rows[1:], 4, 4)
    story.append(make_table(edit_rows, [18 * mm, 38 * mm, 86 * mm, 96 * mm], font, body_size=5.8, row_heights=[7 * mm] + [7 * mm] * 4))

    story.append(PageBreak())
    story.append(p("3. 颜色标准", styles["h1"]))
    if order.get("colorPolicy") == "active-development":
        story.append(p("开发色以FHI TCX目标及已批准实物色卡或Lab Dip为准；屏幕色仅作预览。", styles["body"]))
    else:
        story.append(p("固定原色以供应商实物色卡为准；没有证据时不得根据屏幕图猜测潘通编号。", styles["body"]))
    story.append(Spacer(1, 3 * mm))
    color_rows = [["色号", "颜色名称", "使用部位", "面料", "潘通/原色编号", "体系", "实物颜色标准", "确认要求"]]
    for x in data.get("colorways", []):
        color_rows.append([x.get("colorwayId"), x.get("name"), x.get("component"), x.get("material"), x.get("pantoneCode") or "待供应商提供原面料对应潘通编号", x.get("system") or "FHI TCX（待确认）", x.get("physicalStandard") or "原面料实物色卡", "生产前核对原色卡与潘通编号"])
    color_rows = [color_rows[0]] + padded(color_rows[1:], 8, 8)
    story.append(make_table(color_rows, [18 * mm, 28 * mm, 28 * mm, 38 * mm, 40 * mm, 28 * mm, 40 * mm, 44 * mm], font, body_size=6.7, row_heights=[10 * mm] + [16 * mm] * 8))

    story.append(PageBreak())
    story.append(p("4. 物料清单（BOM）", styles["h1"]))
    bom_rows = [["行号", "类别", "部件", "位置", "完整规格", "物料编码", "颜色/潘通", "单位", "单件用量"]]
    for x in data.get("bom", []):
        bom_rows.append([x.get("lineId"), x.get("category"), x.get("component"), x.get("placement"), x.get("spec"), x.get("materialCode"), x.get("colorRef"), x.get("unit"), x.get("consumption")])
    bom_rows = [bom_rows[0]] + padded(bom_rows[1:], 22, 9)
    story.append(make_table(bom_rows, [15 * mm, 20 * mm, 28 * mm, 28 * mm, 66 * mm, 24 * mm, 50 * mm, 16 * mm, 18 * mm], font, body_size=5.9))

    story.append(PageBreak())
    story.append(p("5. 成衣尺寸、POM与公差", styles["h1"]))
    story.append(p(f"{clean(order.get('market') or '目标市场')} {'/'.join(parse_sizes(order))}；以下为成衣尺寸。人体净尺寸与成衣尺寸必须分开管理，半围/全围按测量方法执行。", styles["body"]))
    story.append(Spacer(1, 3 * mm))
    sizes = parse_sizes(order)
    pom_rows = [["POM", "测量部位", "测量方法", "单位", "公差+", "公差-", *sizes]]
    for x in data.get("pom", []):
        pom_rows.append([x.get("pomId"), x.get("nameCn"), x.get("measurementMethod"), x.get("unit"), x.get("tolerancePlus"), x.get("toleranceMinus"), *[(x.get("values") or {}).get(s) for s in sizes]])
    pom_rows = [pom_rows[0]] + padded(pom_rows[1:], 24, 6 + len(sizes))
    story.append(make_table(pom_rows, [16 * mm, 28 * mm, 90 * mm, 14 * mm, 16 * mm, 16 * mm] + [18 * mm] * len(sizes), font, body_size=5.9))

    story.append(PageBreak())
    story.append(p("6. 车缝结构与工艺", styles["h1"]))
    con_rows = [["工序ID", "部位", "工艺说明", "缝型", "线迹类型", "针距/SPI", "缝份", "线材/线色", "设备", "质量要求"]]
    for x in data.get("construction", []):
        con_rows.append([x.get("operationId"), x.get("area"), x.get("operation"), x.get("seamType"), x.get("stitchType"), x.get("spi"), x.get("seamAllowance"), x.get("thread"), x.get("machine"), x.get("qualityNote")])
    con_rows = [con_rows[0]] + padded(con_rows[1:], 22, 10)
    story.append(make_table(con_rows, [17 * mm, 22 * mm, 52 * mm, 22 * mm, 22 * mm, 16 * mm, 20 * mm, 32 * mm, 29 * mm, 52 * mm], font, body_size=5.8))

    story.append(PageBreak())
    story.append(p("7. 图稿、标签与包装", styles["h1"]))
    art_rows = [["图稿ID", "名称", "工艺", "位置", "宽", "高", "单位", "颜色数", "文件/比例"]]
    for x in data.get("artwork", []):
        art_rows.append([x.get("artworkId"), x.get("name"), x.get("technique"), x.get("placement"), x.get("width"), x.get("height"), x.get("unit"), x.get("colorCount"), " / ".join([clean(x.get("fileRef")), clean(x.get("scale"))]).strip(" / ")])
    art_rows = [art_rows[0]] + padded(art_rows[1:], 8, 9)
    story.append(make_table(art_rows, [18 * mm, 32 * mm, 32 * mm, 35 * mm, 15 * mm, 15 * mm, 15 * mm, 18 * mm, 58 * mm], font, body_size=6.3))
    story.append(Spacer(1, 6 * mm))
    pack_rows = [["项目ID", "类别", "项目", "规格", "位置", "单位", "单件数量", "图稿引用", "生产备注"]]
    for x in data.get("labelsPackaging", []):
        pack_rows.append([x.get("itemId"), x.get("category"), x.get("item"), x.get("spec"), x.get("placement"), x.get("unit"), x.get("quantityPerPiece"), x.get("artworkRef"), "按确认样执行"])
    pack_rows = [pack_rows[0]] + padded(pack_rows[1:], 10, 9)
    story.append(make_table(pack_rows, [18 * mm, 20 * mm, 32 * mm, 66 * mm, 38 * mm, 15 * mm, 18 * mm, 35 * mm, 26 * mm], font, body_size=5.9))

    story.append(PageBreak())
    story.append(p("8. 标签位置参考图", styles["h1"]))
    placements = [x for x in data.get("labelsPackaging", []) if x.get("placementImage")][:4]
    placement_count = 2 if len(placements) <= 2 else 4
    while len(placements) < placement_count:
        placements.append({})
    for row_start in range(0, placement_count, 2):
        row_items = placements[row_start:row_start + 2]
        placement_table = Table([[visual_cell({"path": x.get("placementImage")} if x.get("placementImage") else x, 108 * mm, 48 * mm, font, "标签位置") for x in row_items]], colWidths=[119 * mm, 119 * mm], rowHeights=[54 * mm])
        placement_table.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, BORDER), ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("BACKGROUND", (0, 0), (-1, -1), PALE_GRAY)]))
        story.append(placement_table)
        story.append(make_table([[f"{clean(x.get('item'))}\n{clean(x.get('placement'))}" for x in row_items]], [119 * mm, 119 * mm], font, body_size=6.4, header=False, row_heights=[12 * mm]))
        story.append(Spacer(1, 2 * mm))
    story.append(Spacer(1, 5 * mm))
    story.append(make_table([["位置尺寸以成品缝线为基准。标签须平服、牢固、不得外露或直接刺激皮肤；最终内容与版式按客户批准稿执行。"]], [238 * mm], font, body_size=8, header=False, row_heights=[16 * mm]))

    story.append(PageBreak())
    story.append(p("9. 测试、合规与质量要求", styles["h1"]))
    test_rows = [["测试ID", "适用市场", "材料/产品", "标准/法规", "要求", "方法", "报告编号", "结果"]]
    for x in data.get("testing", []):
        test_rows.append([x.get("testId"), x.get("market"), x.get("materialOrProduct"), x.get("standard"), x.get("requirement"), x.get("method"), x.get("reportId"), x.get("result")])
    test_rows = [test_rows[0]] + padded(test_rows[1:], 18, 8)
    story.append(make_table(test_rows, [17 * mm, 25 * mm, 34 * mm, 42 * mm, 70 * mm, 58 * mm, 24 * mm, 20 * mm], font, body_size=5.7))

    story.append(PageBreak())
    story.append(p("10. 面料信息、产品卖点与文案", styles["h1"]))
    fabric = data.get("fabricDetail", {})
    fabric_rows = [
        ["字段", "内容", "字段", "内容", "字段", "内容"],
        ["面料编号", fabric.get("code"), "商业名称", fabric.get("name"), "系列", fabric.get("series")],
        ["成分", fabric.get("composition") or requirement(data, "REQ-005"), "克重", fabric.get("gsm") or requirement(data, "REQ-006"), "可用幅宽", fabric.get("usableWidth") or requirement(data, "REQ-007")],
        ["结构/手感", "；".join(filter(None, [clean(fabric.get("structure")), clean(fabric.get("handFeel"))])), "弹性/回复", "；".join(filter(None, [clean(fabric.get("stretch")), clean(fabric.get("recovery"))])), "现货颜色", "、".join(fabric.get("stockColors") or [])],
        ["适用季节", fabric.get("season"), "护理提示", fabric.get("care"), "证据状态", fabric.get("status") or "pending"],
    ]
    story.append(make_table(fabric_rows, [24 * mm, 58 * mm, 24 * mm, 58 * mm, 24 * mm, 65 * mm], font, body_size=6.3, row_heights=[8 * mm] + [13 * mm] * 4))
    story.append(Spacer(1, 5 * mm))
    copy = data.get("copywriting", {})
    copy_rows = [["类型", "内容", "依据", "使用场景", "状态"]]
    for item in copy.get("sellingPoints", []):
        if isinstance(item, str):
            copy_rows.append(["产品卖点", item, "", "商品页", copy.get("status") or "pending"])
        else:
            copy_rows.append(["产品卖点", item.get("text"), item.get("evidence"), item.get("channel") or "商品页", item.get("status") or "pending"])
    if copy.get("shortCopy"):
        copy_rows.append(["短文案", copy.get("shortCopy"), copy.get("copyBasis"), copy.get("shortCopyChannel") or "列表页/社媒", copy.get("status") or "pending"])
    if copy.get("longCopy"):
        copy_rows.append(["长文案", copy.get("longCopy"), copy.get("copyBasis"), copy.get("longCopyChannel") or "详情页/独立站", copy.get("status") or "pending"])
    if copy.get("keywords"):
        copy_rows.append(["关键词", "；".join(copy.get("keywords")), copy.get("keywordBasis"), copy.get("keywordChannel") or "检索/商品页", copy.get("status") or "pending"])
    story.append(make_table(copy_rows, [24 * mm, 92 * mm, 58 * mm, 45 * mm, 24 * mm], font, body_size=6.1))

    if data.get("deliverables", {}).get("includeMarketPage") is False:
        return story

    story.append(PageBreak())
    story.append(p("11. 市场对标、尺码分析与首测配码", styles["h1"]))
    market = data.get("marketBenchmark", {})
    story.append(p(f"核心平台：{clean(market.get('primaryPlatform') or order.get('salesPlatform') or '主要销售平台')}；数据日期：{clean(market.get('capturedAt'))}。公开价格、排名、评论和购买标识会随时间及商品变体变化。", styles["body"]))
    story.append(Spacer(1, 2 * mm))
    benchmark_rows = [["品牌", "同类款", "价格", "评分/评论", "销量信号", "尺码范围", "面料/合身反馈", "来源"]]
    for x in market.get("comparables", [])[:5]:
        rating_review = " / ".join(filter(None, [f"{x.get('rating')}分" if x.get('rating') else "", f"{x.get('reviewCount')}条评论" if x.get('reviewCount') else ""]))
        benchmark_rows.append([
            x.get("brand"), x.get("product"), x.get("priceDisplay") or " ".join(filter(None, [clean(x.get("currency")), clean(x.get("price"))])),
            rating_review, x.get("salesSignal"), x.get("sizeRange"), "；".join(filter(None, [clean(x.get("material")), clean(x.get("fitInsight"))])), x.get("sourceLabel") or x.get("sku"),
        ])
    story.append(make_table(benchmark_rows, [22 * mm, 44 * mm, 24 * mm, 29 * mm, 36 * mm, 25 * mm, 65 * mm, 28 * mm], font, body_size=5.6))
    story.append(Spacer(1, 4 * mm))

    size_rows = [["尺码", "美国数字码", "胸围(in)", "胸围(cm)", "腰围(in)", "腰围(cm)", "臀围(in)", "臀围(cm)", "数据属性"]]
    for x in market.get("sizeBodyReference", data.get("sizeBasis", {}).get("bodyRows", [])):
        size_rows.append([x.get("size"), x.get("usNumeric"), x.get("bustIn"), x.get("bustCm"), x.get("waistIn"), x.get("waistCm"), x.get("hipIn"), x.get("hipCm"), x.get("dataType", "人体净尺寸参考")])
    story.append(make_table(size_rows, [15 * mm, 22 * mm, 22 * mm, 25 * mm, 22 * mm, 25 * mm, 22 * mm, 25 * mm, 34 * mm], font, body_size=6.2))
    story.append(Spacer(1, 4 * mm))

    allocation_sizes = parse_sizes(order)[:6]
    allocation_rows = [["颜色", "颜色属性", "每色数量", *allocation_sizes, "合计", "建议依据"]]
    for x in market.get("testAllocationByColor", []):
        values = [int((x.get("unitsBySize") or {}).get(size) or 0) for size in allocation_sizes]
        allocation_rows.append([x.get("color"), x.get("classification"), x.get("unitsPerColor"), *values, sum(values), x.get("rationale")])
    widths = [22 * mm, 24 * mm, 22 * mm] + [15 * mm] * len(allocation_sizes) + [18 * mm, (174 - 15 * len(allocation_sizes)) * mm]
    story.append(make_table(allocation_rows, widths, font, body_size=5.9))
    story.append(Spacer(1, 4 * mm))
    story.append(make_table([[f"口径说明：{clean(market.get('methodNote') or '公开页面不提供竞品按颜色与尺码的精确成交量；首测配码属于市场信号、版型与面料特性共同形成的测试建议。')}\n结论：{clean(market.get('salesConclusion'))}\n复盘指标：售罄率、售出用时、退换货方向、退货原因与断码率。"]], [253 * mm], font, body_size=7.2, header=False))
    return story


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--logo")
    parser.add_argument("--font", required=True)
    args = parser.parse_args()

    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    font_name = "NotoCJK"
    try:
        pdfmetrics.registerFont(TTFont(font_name, args.font))
    except Exception:
        font_name = "STSong-Light"
        pdfmetrics.registerFont(UnicodeCIDFont(font_name))
    styles = make_styles(font_name)
    order = data.get("order", {})
    doc = BaseDocTemplate(
        str(output),
        pagesize=landscape(A4),
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=14 * mm,
        bottomMargin=12 * mm,
        title=f"{clean(order.get('styleNo') or order.get('orderId'))} {clean(order.get('documentTitle') or '服装工艺单')}",
        author=clean(order.get("producerBrand") or order.get("brand") or ""),
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=lambda c, d: page_decorator(c, d, font_name, order))])
    doc.build(build_story(data, args.logo, font_name, styles))
    print(output)


if __name__ == "__main__":
    main()
