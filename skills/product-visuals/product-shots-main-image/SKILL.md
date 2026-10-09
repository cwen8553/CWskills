---
name: product-shots-main-image
description: 从真实产品图制作电商列表主图和有证据的副图；适用于 Amazon US 等明确平台的主图、白底产品图、细节图和多颜色列表素材，不把详情长图作为列表主图。
license: MIT
metadata:
  author: motiful
  source: https://github.com/motiful/product-shots
  version: '4.0.0'
---

# 商品列表主图与副图

制作产品身份准确、用途与平台版位明确的商品列表图片。

## 适用场景

单款主图、颜色变体、细节与场景副图；不负责整页故事设计。

## 核心工作流程

1. 查看每色真实产品参考，确认售卖内容、品牌、目标类目与版位。
2. 读 [平台规则核验](references/amazon-us-current.md) 与 [产品质量](../product-shots/references/production-quality.md)。区分摄影方案与平台硬规则。
3. 根据用户数量选择主图、细节、使用场景、包含物或选择参考，不固定三图或九图。
4. 主图与副图持续绑定原始产品证据。副图可参考合格主图的光线，不把生成图升级为结构真源。
5. 调用 [生成执行器](../product-shots-image-gen/SKILL.md)，保留真实产品商标，不添加无证据的配件、促销或认证。
6. 检查实际像素、边缘、背景、产品完整性及缩略图可读性；未知颜色或背面结构不猜造。

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
