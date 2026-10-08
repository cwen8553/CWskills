# CWskills

**可验证、可组合的电商 Agent Skills 开源资料库。**

CWskills 把服装开发、电商文案和商品视觉拆成可独立安装的小插件。每个 Skill 都说明什么时候用、需要什么输入、会交付什么，以及哪些信息不能凭空补造。

## 为什么做这个库

电商工具很容易停在“会写 Prompt”。CWskills 更关心真实交付：

- 产品资料有没有被正确读取；
- 款式、面料、颜色、尺码和品牌信息有没有被混用；
- 市场数据、销量、评价、认证和功效有没有可追溯来源；
- 最终文件或图片是否真正可用，而不只是生成了一份报告。

## Skill 目录

### 服装开发

| Skill | 一句话定义 | 详情 |
|---|---|---|
| `apparel-techpack-production` | 把款式图、面料表、尺码和市场证据转成可编辑的 XLSX/PDF 服装工艺单 | [查看详情](skills/apparel-development/apparel-techpack-production/README.md) |

### 电商文案

| Skill | 一句话定义 | 详情 |
|---|---|---|
| `ecommerce-visual-copywriting` | 把产品资料转成主图、详情页、Listing 和 A+ 可直接执行的视觉文案方案 | [查看详情](skills/ecommerce-content/ecommerce-visual-copywriting/README.md) |

### 商品视觉

| Skill | 一句话定义 | 详情 |
|---|---|---|
| `product-shots` | 商品图任务的总入口，路由到主图、详情页、广告、社媒或多角度流程 | [查看详情](skills/product-visuals/product-shots/README.md) |
| `product-shots-main-image` | 为 Amazon US 等商品列表制作白底主图和证据型副图 | [查看详情](skills/product-visuals/product-shots-main-image/README.md) |
| `product-shots-detail-page` | 制作连贯的商品详情长图和 Amazon A+ 模块 | [查看详情](skills/product-visuals/product-shots-detail-page/README.md) |
| `product-shots-multi-angle` | 根据真实人物或产品参考生成一致的多角度视觉 | [查看详情](skills/product-visuals/product-shots-multi-angle/README.md) |
| `product-shots-ad-creative` | 按平台、版位、投放目标和行业制作广告创意 | [查看详情](skills/product-visuals/product-shots-ad-creative/README.md) |
| `product-shots-social-post` | 制作 Feed、Story、Reel 封面和 Carousel 等原生社媒视觉 | [查看详情](skills/product-visuals/product-shots-social-post/README.md) |
| `product-shots-image-gen` | 商品图生成执行器，使用宿主内置生图并实际检查交付结果 | [查看详情](skills/product-visuals/product-shots-image-gen/README.md) |

## 目录结构

```text
CWskills/
├── skills/
│   ├── apparel-development/   # 服装开发
│   ├── ecommerce-content/     # 电商文案
│   └── product-visuals/       # 商品视觉
├── CONTRIBUTING.md
├── SECURITY.md
├── THIRD_PARTY_NOTICES.md
└── LICENSE
```

## 安装

克隆仓库：

```bash
git clone https://github.com/cwen8553/CWskills.git
cd CWskills
```

安装单个 Skill，将对应目录复制到你的 Skills 目录。例如：

```bash
cp -R skills/apparel-development/apparel-techpack-production ~/.codex/skills/
```

如果安装 `product-shots` 视觉套件，建议将 `skills/product-visuals/` 下的所有子 Skill 一起复制到同一层 Skills 目录，以保持路由与参考路径有效。

## 使用方式

安装后直接描述任务，宿主可根据 `description` 自动路由；也可显式点名 Skill。

```text
用 apparel-techpack-production 把这个套装拆成上衣和下装两份工艺单。
```

```text
用 ecommerce-visual-copywriting 为这个产品写 Amazon A+ 的图片脚本和图内英文。
```

```text
用 product-shots-main-image 为这个商品制作 Amazon US 白底主图与两张副图。
```

## 开源与来源

仓库根目录以 MIT License 发布。部分 Skill 基于其他 MIT 开源项目整理或改进，保留原作者、来源与子目录许可文件；详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 贡献

欢迎提交新 Skill、修复规则、补充测试或改善说明。提交前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
