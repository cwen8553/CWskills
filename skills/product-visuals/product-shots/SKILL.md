---
name: product-shots
description: 根据产品原图、目标平台与用途，将电商图片请求路由到主图、副图、A+、广告、社媒或多角度流程。
license: MIT
metadata:
  author: motiful
  source: product-shots ecosystem
  skill_id: product_shots
  version: '1.0'
---

# 商品图片路由

用户提供详情长图/拼贴参考，或否定相册式单图交付时，先读 [连贯商品详情排版](references/editorial-product-story.md)。采用先整页、后模块的设计流程；白底主图仍独立，来源备注不替代商品视觉。仅优化 Skill 时不宣称已改好图片。

先读 [生产质量标准](references/production-quality.md)。已有产品和平台信息直接继续，只问会阻止正确出图的缺失信息。不使用固定五轮问答或虚构可点击 suggestion 标签。

中文交流可以配美式英文图片文案：对话语言与市场文案语言分别确定。

- Amazon MAIN / listing carousel：`../product-shots-main-image/SKILL.md`。
- A+：`../product-shots-detail-page/SKILL.md`；按实际模块规格设计。
- 明确要求同一模特多角度：`../product-shots-multi-angle/SKILL.md`，没有背面依据的结构需标注不确定。
- 付费广告：`../product-shots-ad-creative/SKILL.md`。
- 社媒：`../product-shots-social-post/SKILL.md`。
- 一般产品视觉：根据用途路由到 `product-shots-main-image` 或 `product-shots-detail-page`。

路由后完成实际生成与检查，不只返回 brief。默认使用内置 image_gen；专用生图接口见 `../product-shots-image-gen/SKILL.md`。原有 references 内的风格表可按需查阅，不把默认受众、问答状态机或未注明来源的转化提升比例当作事实。
