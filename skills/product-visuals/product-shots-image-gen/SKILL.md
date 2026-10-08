---
name: product-shots-image-gen
description: 为 product-shots 技能执行图片生成及参考图编辑，使用宿主已提供的内置生图能力，并在交付前实际检查产品保真、文字、像素与构图。
license: MIT
metadata:
  author: motiful
  source: product-shots ecosystem
  skill_id: product_shots_image_gen
  version: '1.0'
---

# 商品图片生成执行器

## 内置生图路径

遵循当前宿主的图片生成工具指南，调用宿主已提供的内置生图能力。该 Skill 不搜索、读取或上传本机 API key，不默认切换到第三方网关。

输入为最终 prompt 和真实参考图；本地图片先查看。按宿主工具要求传入最少必要的参考图，不重复添加无关图片。

每张产物分别生成，保存后实际查看；确认产品身份、文字、尺寸与构图。将项目最终图片放进用户工作目录并展示。多张图都应绑定原始产品参考，不能通过不断复制前一代输出积累漂移。

## 失败边界
内置工具失败时说明失败，不自动切换到外部付费 API。产品关键细节两次仍漂移则停止该图重试，交付候选及具体缺陷。不得只返回 prompt 却声称图片已经生成。
