# product-shots-multi-angle

制作同款商品的多角度、三视图或同一模特系列。

## 它解决什么问题

解决正侧背不一致、标签左右错位和多颜色逐次漂移。

## 什么时候使用

需要款式正侧背、lookbook 或同一人物的多视角图。

## 需要什么输入

各角度真实商品参考；需要人物一致时另给人物参考及使用权。 已有信息直接沿用，缺少关键事实时先完成不受影响的部分。

## 会交付什么

按本次视角与颜色清单完成的图片和并排对照。

## 核心边界

不从正面猜造背部结构；不固定九张，也不通过拉伸人物修比例。

## 用户可修改的配置

同一品牌可以保存 Logo、色板、字体和文案语气；每个项目单独填写市场、语言、人群、颜色、视角、人物动作、材料、尺码、模块顺序和输出格式。

先复制 [品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段含义、默认值和需要确认的内容见 [配置指南](../product-shots/references/configuration.md)。不想手填时，把资料交给 Agent 代填。不得把上一款的参数、尺码或认证当作默认配置。

## 调用示例

```text
用 product-shots-multi-angle 做两色正面、左侧和背面图，侧标以穿着者方向为准。
```

```text
沿用这个项目配置，只改已指出的模块，并同步相关预览、整页和下载文件。
```

## 使用与来源

商品视觉技能共享 product-shots 中的配置和规则，安装时将本分类七个技能目录放在同一层。需要宿主提供图片生成与文件操作能力。流程入口见 [SKILL.md](SKILL.md)。

基于 [motiful/product-shots](https://github.com/motiful/product-shots) 整理，保留 [MIT 许可证](LICENSE)。当前工作流与配置由 CWskills 维护。
