# product-shots-ad-creative

制作明确目标和版位的商品广告图片。

## 它解决什么问题

减少把同一长图硬裁成不同版位、优惠内容写错或虚构效果数字。

## 什么时候使用

新品广告、真实活动素材或同商品多个广告版本。

## 需要什么输入

产品资料、投放目标、版位和本次已确认的活动信息。 已有信息直接沿用，缺少关键事实时先完成不受影响的部分。

## 会交付什么

广告图、准确文案、不同版本的测试变量及检查记录。

## 核心边界

不自动投放，不捏造折扣、截止时间、评价或转化率。

## 用户可修改的配置

同一品牌可以保存 Logo、色板、字体和文案语气；每个项目单独填写市场、语言、人群、颜色、视角、人物动作、材料、尺码、模块顺序和输出格式。

先复制 [品牌模板](../product-shots/assets/brand-profile-template.json) 与 [项目模板](../product-shots/assets/project-config-template.json)，字段含义、默认值和需要确认的内容见 [配置指南](../product-shots/references/configuration.md)。不想手填时，把资料交给 Agent 代填。不得把上一款的参数、尺码或认证当作默认配置。

## 调用示例

```text
用 product-shots-ad-creative 为这个产品做两个广告构图版本，不添加优惠信息，沿用品牌配置。
```

```text
沿用这个项目配置，只改已指出的模块，并同步相关预览、整页和下载文件。
```

## 使用与来源

商品视觉技能共享 product-shots 中的配置和规则，安装时将本分类七个技能目录放在同一层。需要宿主提供图片生成与文件操作能力。流程入口见 [SKILL.md](SKILL.md)。

基于 [motiful/product-shots](https://github.com/motiful/product-shots) 整理，保留 [MIT 许可证](LICENSE)。当前工作流与配置由 CWskills 维护。
