# 文案配置与视觉交接

复制 [input-template.json](../assets/input-template.json) 到自己的项目。也可由 Agent 从现有资料整理。brand_profile/project_config 如已由商品视觉流程创建，直接读取，避免重复维护品牌事实；两个技能都用原始证据，不能以对方输出替代事实源。

| 字段 | 含义 / 可选值 | 必填、默认 | 确认要求 |
|---|---|---|---|
| schema_version | 固定 1 | 是，1 | 系统字段 |
| mode | direct / plan_first / audit / handoff | 是，direct | 先确认模式取用户要求 |
| brand_profile | 项目内品牌配置路径或 null | 否，null | 同品牌可复用已授权风格 |
| project_config | 项目内视觉配置路径或 null | 否，null | 只用于本项目，不跨商品复用事实 |
| market | 目标市场 | 执行必需，null | 用户确认或现有项目资料 |
| copy_language | 图片/页面文案语言 | 执行必需，null | 不等同于对话语言 |
| audience | 人群 | 执行必需，null | 不默认套用其他品类人群 |
| output | storyboard / copy / audit / handoff | 是，storyboard | 本次输出范围 |
| source_files | 项目内来源路径数组 | 事实文案必需，[] | 仅阅读指定文件，不搜索私人目录 |
| claim_records | {text,scope,status,source_files} 数组 | 否，[] | scope 为 brand/fiber/fabric/garment/product/tag；status 为 pending/verified/rejected |
| module_order | 模块名称有序数组 | 否，[] | 可编辑，不固定材料页位置 |
| tone | 语气文字或 null | 否，null | 品牌偏好，可复用 |

空值未知，不由旧案例补齐。verified 需要实际来源与适用范围核对。成分、尺码、认证、价格、促销、供应商和人物授权不得跨项目默认继承。

## 材料内容

材料科普、品牌研发故事和本品功能分开。纤维资料不能自动支持所有混纺成衣的性能；环保属性要区分来源、制造影响和终端处置条件。没有本品证据时不写确定的性能、降解或认证承诺。吊牌图片只证明图样存在，不自动证明宣称范围。

消费者页面保留有用信息与必要条件，来源链及核验备注放内部账本。清理冗长脚注不能把待补证内容变成事实。图片生产由商品视觉技能执行；本技能交付文案与执行卡，不复制生图工作流。
