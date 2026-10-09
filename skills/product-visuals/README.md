# 分类：商品视觉

从真实产品参考出发，路由到主图、详情页、广告、社媒和多角度等不同交付类型。

- [`product-shots`](product-shots/README.md)：总入口与任务路由。
- [`product-shots-main-image`](product-shots-main-image/README.md)：Amazon US 主图与副图。
- [`product-shots-detail-page`](product-shots-detail-page/README.md)：详情长图与 A+。
- [`product-shots-multi-angle`](product-shots-multi-angle/README.md)：同一人物/产品的多角度系列。
- [`product-shots-ad-creative`](product-shots-ad-creative/README.md)：付费投放创意。
- [`product-shots-social-post`](product-shots-social-post/README.md)：原生社媒视觉。
- [`product-shots-image-gen`](product-shots-image-gen/README.md)：生图执行与结果检查。

## 共享配置，一次整理

本分类共 7 个技能，按用途协作，不为每个品牌或颜色复制技能。安装时保留这七个目录在同一层。

[品牌模板](product-shots/assets/brand-profile-template.json)、[项目模板](product-shots/assets/project-config-template.json) 和 [字段说明](product-shots/references/configuration.md) 由 product-shots 统一维护。详情页、多角度、主图等读取同一份配置。

“商品详情页图文制作”“电商详情页”进入详情页技能；材料页与尺码页是其中可配置模块，不独立拆成相近 Skill。成人、童装与不同材料分别绑定本次证据。
