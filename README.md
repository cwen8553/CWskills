# CWskills

**可配置、可组合、可验证的电商 Agent Skills 工作系统。**

CWskills 帮助用户减少重复整理、判断、检查和交付工作。通用 Skill 负责方法，用户可编辑的 Profile 负责品牌与工作习惯，项目资料负责真实产品事实。更换品牌、材料、女装或童装时修改配置与资料，不复制一整套 Skill。

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

## 个性化工作方式

1. 保存同品牌可复用的 [品牌 Profile](skills/product-visuals/product-shots/assets/brand-profile-template.json)：Logo、色板、字体、语气和摄影偏好。
2. 每个产品新建 [项目配置](skills/product-visuals/product-shots/assets/project-config-template.json)：市场、语言、人群、颜色、视角、材料、尺码、模块顺序与交付范围。具体字段见 [配置指南](skills/product-visuals/product-shots/references/configuration.md)。
3. 只做策划时使用 [文案输入模板](skills/ecommerce-content/ecommerce-visual-copywriting/assets/input-template.json)；已有视觉配置可以直接引用。
4. 局部返修沿用产品真源，更新受影响图片及其整页、预览和下载文件。用 [交付清单](skills/product-visuals/product-shots/assets/output-schema.json) 追踪当前产物。

模板可由 Agent 根据用户资料填写。空值表示未知，不会从旧案例补造事实。私有 Profile、原图、报价、认证与尺码资料保存在用户项目，不提交进公共技能库。

```text
商品详情页图文制作：沿用我的品牌 Profile，按本次双色实拍和尺码资料制作完整电商详情页；材料页单独导出，并同步整页与模块。
```

## 能力边界与组合

文案技能负责证据、文案和画面任务卡；视觉入口复用配置并路由，主图、详情页、多角度、广告与社媒各管自己的交付，生成执行器负责实际图片。服装开发仍负责工艺与生产数据，不被商品图流程替代。

本次整合增强现有 8 个技能，技能总数仍为 9；没有另建重叠的套图或参考编辑技能。迁移取舍与公开内容范围见 [整合记录](docs/skill-integration.md)。

## 发布前验证

Python 3.9+；仓库检查需要 PyYAML，脚本语法检查需要 Node.js 与 bash。依赖见 [requirements-checks.txt](requirements-checks.txt)。仓库检查脚本不安装依赖、不联网、不读取凭据。

```bash
python3 scripts/validate_repository.py
python3 -m unittest discover -s skills/product-visuals/product-shots/tests -v
python3 skills/ecommerce-content/ecommerce-visual-copywriting/tools/verify-skill.py
```

检查覆盖 Skill 入口、YAML/JSON、相对链接、目录导航、脚本语法和常见泄密模式。品牌授权、事实有效性、实际图片质量与目标平台发布结果仍由实际资料和人工/Agent 查看验证；自动检查不会证明它们。

## 开源与来源

仓库根目录以 MIT License 发布。部分 Skill 基于其他 MIT 开源项目整理或改进，保留原作者、来源与子目录许可文件；详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 贡献

欢迎提交新 Skill、修复规则、补充测试或改善说明。提交前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
