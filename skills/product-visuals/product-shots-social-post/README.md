# product-shots-social-post

## 一句话定义

为 Instagram、TikTok、Facebook、Pinterest、小红书、LinkedIn 等平台制作原生的 Feed、Story、Reel 封面和 Carousel 视觉。

## 何时使用

适合新品发布、知识型轮播、生活方式内容、活动预告、短视频封面和品牌 Feed 视觉。付费投放素材应使用 `product-shots-ad-creative`。

## 输入

平台与格式、内容目标（分享/收藏/评论）、行业、产品素材、品牌系统、文案和希望的张数。

## 输出

平台正确的尺寸与安全区、设计说明、可选文案、轮播连续锚点、生图 Prompt 和交付前自检。

## 边界

- 平台格式和内容目标不明时，只补问会改变成品的信息。
- 轮播图的一致性需在每张图中重复核心锚点，不只在总说明里声明一次。
- 平台 UI、假水印、假按钮和未授权 Logo 不进入生成 Prompt。

## 调用示例

```text
用 product-shots-social-post 为这款新品做 5 页 Instagram 4:5 Carousel，目标是收藏，并保持同一色板和排版节奏。
```
