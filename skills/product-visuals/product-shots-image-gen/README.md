# product-shots-image-gen

执行明确图片任务的生成与参考编辑，并查看实际结果。

## 它解决什么问题

减少只交提示词、生成图多次衍生失真或失败后偷偷改用付费接口。

## 什么时候使用

已经有画面任务与真实参考，需要出图或局部修正。

## 需要什么输入

最终任务卡、原始产品参考、保持项和允许变化项。 已有信息直接沿用，缺少关键事实时先完成不受影响的部分。

## 会交付什么

实际图片、尺寸与检查结果；失败时保留任务卡并说明未完成项。

## 核心边界

不寻找 API key、不默认外传素材；工具失败不会被描述为已生成。

## 用户可修改的配置

同一品牌可以保存 Logo、色板、字体和文案语气；每个项目单独填写市场、语言、人群、颜色、视角、人物动作、材料、尺码、模块顺序和输出格式。

先复制 [品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段含义、默认值和需要确认的内容见 [配置指南](../product-shots/references/configuration.md)。不想手填时，把资料交给 Agent 代填。不得把上一款的参数、尺码或认证当作默认配置。

## 调用示例

```text
用 product-shots-image-gen 修正这张人物图的比例，保持衣服结构和面孔，用原始参考重新生成。
```

```text
沿用这个项目配置，只改已指出的模块，并同步相关预览、整页和下载文件。
```

## 使用与来源

商品视觉技能共享 product-shots 中的配置和规则，安装时将本分类七个技能目录放在同一层。需要宿主提供图片生成与文件操作能力。流程入口见 [SKILL.md](SKILL.md)。

基于 [motiful/product-shots](https://github.com/motiful/product-shots) 整理，保留 [MIT 许可证](LICENSE)。当前工作流与配置由 CWskills 维护。
