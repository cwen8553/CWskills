---
name: product-shots-detail-page
description: 把真实商品参考、品牌配置和已证实卖点制作成连贯的电商详情页、Amazon A+ 及可拆分模块；响应“商品详情页图文制作”“电商详情页”“详情长图”，支持多颜色、材料页与尺码页，白底主图另行路由。
license: MIT
metadata:
  author: motiful
  source: https://github.com/motiful/product-shots
  version: '4.0.0'
---

# 商品详情页图文制作

把产品事实组织为连贯、可编辑、可拆分的商品详情视觉，减少单图拼凑与重复返工。

## 适用场景

商品详情长页、A+、材料独立宣传页、现有模块替换；适用于成人服装、童装及其他有真实资料的商品。

## 核心工作流程

1. 先读 [整页设计](../product-shots/references/editorial-product-story.md) 与 [产品质量](../product-shots/references/production-quality.md)。锁定本品结构、配色与证据。
2. 先设计整页缩略构图和信息节奏，再制作素材。每模块回答一个购买问题，不强行凑页数。
3. 按需读取 [人物与场景](../product-shots/references/model-scene-material.md)、[提示词组件](../product-shots/references/prompt-components.md)、[材料叙事](../product-shots/references/material-evidence.md)、[尺码逻辑](../product-shots/references/apparel-size-layout.md)。没有该模块不加载对应规则。
4. 两色或多色按 colors 与 views 配置展开；三视图由多角度技能执行，保留产品正侧背结构与穿着者方向。
5. 照片生成交给 [生成执行器](../product-shots-image-gen/SKILL.md)；精确 Logo、图内文字与尺码表优先用授权原件及可编辑排版。
6. 材料页可独立导出；它与尺码页的先后取 module_order，不将某客户偏好固化成全局规则。
7. 检查整页、模块和手机阅读效果，按 [一致性](references/consistency-rules.md) 返修。A+ 导出前读 [规格处理](references/aplus-specifications.md)。

## 配置与输入

读取用户已提供的真实产品图、产品资料和本次输出范围。沿用已确认信息，不重复问答。
使用 [共享品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段说明见 [配置指南](../product-shots/references/configuration.md)。模板可不预先填写，由 Agent 从已有资料整理；未知事实保留 null。

## 事实、权限和失败边界

原始资料决定产品事实；风格参考只决定摄影与排版。不得编造尺寸、成分、认证、价格、评价或功效。材料证据不得跨产品沿用。当前平台数值与政策在任务时核验，并记录官方来源、适用版位和核验日期。
按用户已授权范围制作，不自动上传、发布、投放或改动其他项目。只用宿主允许的能力；生成失败说明实际状态，不自动读取凭据或切换外部付费接口。
候选图有款式或人物错误时修正对应产物；不能以提示词、任务编号或文件存在代替看图验收。

## 输出要求

交付本任务对应的实际产物和可编辑文案/排版源，记录真实像素、来源绑定与检查结果。仅策划任务交付执行卡，不声称已生成图片。
按 [交付与局部修改](../product-shots/references/delivery-protocol.md) 更新相关导出，内部证据记录与消费者页面分开保存。
