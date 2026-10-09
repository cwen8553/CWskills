# product-shots-main-image

制作目标电商版位的商品主图和证据型副图。

## 它解决什么问题

减少主副图串用、产品细节被改错和平台尺寸未核对的问题。

## 什么时候使用

需要白底主图、细节副图、颜色变体或场景副图。

## 需要什么输入

每色真实产品图、售卖内容、类目与站点、必要参数。 已有信息直接沿用，缺少关键事实时先完成不受影响的部分。

## 会交付什么

实际主副图、准确文案、真实像素和结构检查记录。

## 核心边界

不会生成虚构配件或资质；主图通过本地检查不等于平台已审核通过。

## 用户可修改的配置

同一品牌可以保存 Logo、色板、字体和文案语气；每个项目单独填写市场、语言、人群、颜色、视角、人物动作、材料、尺码、模块顺序和输出格式。

先复制 [品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段含义、默认值和需要确认的内容见 [配置指南](../product-shots/references/configuration.md)。不想手填时，把资料交给 Agent 代填。不得把上一款的参数、尺码或认证当作默认配置。

## 调用示例

```text
用 product-shots-main-image 制作这件上衣的两个颜色主图，标签位置按各色原图核对。
```

```text
沿用这个项目配置，只改已指出的模块，并同步相关预览、整页和下载文件。
```

## 使用与来源

商品视觉技能共享 product-shots 中的配置和规则，安装时将本分类七个技能目录放在同一层。需要宿主提供图片生成与文件操作能力。流程入口见 [SKILL.md](SKILL.md)。

基于 [motiful/product-shots](https://github.com/motiful/product-shots) 整理，保留 [MIT 许可证](LICENSE)。当前工作流与配置由 CWskills 维护。
