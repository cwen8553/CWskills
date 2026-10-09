---
name: product-shots
description: 根据真实产品资料与用户配置组织电商商品套图，路由主图、商品详情页图文制作、电商详情页、多角度、广告和社媒；用于跨颜色及多格式生产和局部返修，不处理纯文案或服装打版。
license: MIT
metadata:
  author: motiful
  source: https://github.com/motiful/product-shots
  version: '4.0.0'
---

# 商品视觉工作流入口

把一次整理好的产品证据与品牌配置传给对应生产技能，减少重复问答、跨颜色漂移和遗漏导出。

## 适用场景

“帮我做一套商品图”、多颜色产品图、多个目标版位或现有套图局部修改。纯文案交给 `ecommerce-visual-copywriting`；服装开发交给 `apparel-techpack-production`。

## 核心工作流程

1. 读取本次项目与品牌配置；按 [产品质量](references/production-quality.md) 记录产品结构、包含物、颜色、标签位置和证据。切换产品时重置事实。
2. 将参考分为 product / detail / color / model / style / evidence，风格页中的文案和图片不成为本品事实。
3. 按用途派发；多个用途共享配置，不复制技能，也不强制串行先做主图。

| 用户目标 | 执行技能 |
|---|---|
| 商品列表主图、副图 | [product-shots-main-image](../product-shots-main-image/SKILL.md) |
| 连贯详情页、图文长页、A+ | [product-shots-detail-page](../product-shots-detail-page/SKILL.md) |
| 商品正侧背、多角度或同一模特系列 | [product-shots-multi-angle](../product-shots-multi-angle/SKILL.md) |
| 付费投放创意 | [product-shots-ad-creative](../product-shots-ad-creative/SKILL.md) |
| 自然社媒帖与轮播 | [product-shots-social-post](../product-shots-social-post/SKILL.md) |
| 执行已定提示词及参考编辑 | [product-shots-image-gen](../product-shots-image-gen/SKILL.md) |

4. 数量、色组、模块顺序和输出格式取项目配置，未知细节不为凑齐套图而补造。
5. 按用途打开并检查实际输出；返修范围由变更影响决定，同步预览与下载文件。

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
