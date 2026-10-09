# product-shots-social-post

将商品主题制作成社媒单图、轮播和独立配文。

## 它解决什么问题

减少轮播重复卖点、图文事实不一致和不同页面风格漂移。

## 什么时候使用

日常产品介绍、材料故事、细节展示或使用方法图文。

## 需要什么输入

商品资料、主题、平台、品牌风格及授权素材。 已有信息直接沿用，缺少关键事实时先完成不受影响的部分。

## 会交付什么

按内容确定页数的图片、单独配文和顺序检查结果。

## 核心边界

不自动发帖；轮播不固定七页，不复制他人素材或制造互动数据。

## 用户可修改的配置

同一品牌可以保存 Logo、色板、字体和文案语气；每个项目单独填写市场、语言、人群、颜色、视角、人物动作、材料、尺码、模块顺序和输出格式。

先复制 [品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段含义、默认值和需要确认的内容见 [配置指南](../product-shots/references/configuration.md)。不想手填时，把资料交给 Agent 代填。不得把上一款的参数、尺码或认证当作默认配置。

## 调用示例

```text
用 product-shots-social-post 将这份材料资料做成商品轮播，图内英文，配文中文，页数按内容决定。
```

```text
沿用这个项目配置，只改已指出的模块，并同步相关预览、整页和下载文件。
```

## 使用与来源

商品视觉技能共享 product-shots 中的配置和规则，安装时将本分类七个技能目录放在同一层。需要宿主提供图片生成与文件操作能力。流程入口见 [SKILL.md](SKILL.md)。

基于 [motiful/product-shots](https://github.com/motiful/product-shots) 整理，保留 [MIT 许可证](LICENSE)。当前工作流与配置由 CWskills 维护。
