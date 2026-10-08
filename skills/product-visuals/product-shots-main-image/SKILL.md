---
name: product-shots-main-image
description: 为 Amazon 商品生成白底主图与有证据的英文副图，核对产品参考、类目规则及实际输出；适用于美国亚马逊 listing 图片。
license: MIT
metadata:
  author: motiful
  source: product-shots ecosystem
  skill_id: product_shots_main_image
  version: '1.0'
---

# Amazon 产品主图与副图

先读 [Amazon US 规则](references/amazon-us-current.md) 和 [生产质量标准](../product-shots/references/production-quality.md)。

## 执行
1. 读取用户选定产品的原图、款号、类目和包含物。文件顺序不是产品身份的替代证据。
2. 保存 Product Lock，划分已证实卖点与未知项。
3. “跑效果”做三张独立图：MAIN、核心细节/利益副图、场景副图；完整套图再按用户数量扩展，不机械生成无资料的尺寸、背面或多色图。
4. MAIN 先生成并与原图核对。副图继续引用原图，可以额外参考已通过的主图，不能把生成主图当作唯一事实源。
5. 使用内置 image_gen 完成实际图片。参考 `../product-shots-image-gen/SKILL.md` 的调用约束。
6. 检查真实像素、背景、产品结构、英文及缩略图可读性；不以“自评满分”替代图片查看。仅返修有问题的图。
7. 展示实际图片、保存路径、已核对项与未核实项。明确概念样稿或待实物确认状态，不承诺平台审核。

## 副图画面
每张只回答一个购买问题。优先真正存在的领口、缝线、门襟、剪裁或用途；材质性能需文档证据。用一张大图和有限标签建立层级，不做密集九宫格和重复长文案。不为填满版面增加虚构图标、认证、评分。

其他 references 属于旧版细分参考；发生冲突时采用已核验官方规则和本入口，不采用未经来源支持的转化率数据、固定 1024 尺寸或“所有商标必须移除”的笼统规则。
