# 输入数据结构

使用 UTF-8 JSON。数字保持数字类型，日期采用 `YYYY-MM-DD`，未知值用 `null` 或空字符串并标记 `pending`，不得填成 0。

## 一级字段

- `schemaVersion`: 当前为 `2.0`。
- `deliverables`: 控制是否输出市场页、文案页、批量管理表和成本填写表。
- `order`: 款号、产品、品牌、市场、版本、尺码与文件命名。
- `sources`: 每条事实的原文件、页码、单元格、图号或网页 URL。
- `requirements`: 用户明确要求与资料事实，冲突值必须分别保留。
- `visuals`: 效果图和正/侧/背技术图。
- `technicalReview`: 设计核心与四条可编辑修改意见。
- `fabricDetail`: 面料代码、名称、成分、克重、幅宽、结构、手感、弹性、回复、遮蔽性、护理、现货色。
- `colorways`: 每个颜色的名称、部件、潘通体系、实物标准和批准状态。
- `bom`, `pom`, `construction`, `artwork`, `labelsPackaging`, `testing`: 正式生产数据。
- `copywriting`: 卖点、短文案、长文案、关键词与证据状态。
- `sizeBasis`: 人体尺码基准，必须与成衣 POM 分开。
- `marketBenchmark`: 对标产品、公开需求信号、按颜色与尺码的首测矩阵。
- `sampleProduction`: 板房/工厂做样、大货负责方与状态。
- `revisions`: 版本、日期、变化、提出人和批准人。

## 必要状态

通用事实状态：`confirmed`, `pending`, `conflict`, `na`。技术图状态：`draft`, `pending`, `approved`, `rejected`。

每个确认事实尽量包含：

```json
{
  "status": "confirmed",
  "sourceId": "SRC-001",
  "sourceLocator": "面料表!B12:F12",
  "note": "供应商规格表"
}
```

## 首测配码

每个颜色单独一行：

```json
{
  "color": "黑色",
  "classification": "core",
  "unitsPerColor": 20,
  "unitsBySize": {"M": 7, "L": 8, "XL": 5},
  "rationale": "宽松版型、公开尺码反馈与目标客群共同形成的首测假设"
}
```

`unitsBySize` 合计必须等于 `unitsPerColor`。两色各 20 件，款式总量为 40 件。

## 文案

卖点行优先用对象，便于追溯：

```json
{
  "text": "柔软垂坠，适合长时间贴身穿着",
  "evidence": "面料成分、克重、手感记录与款式结构",
  "channel": "商品页",
  "status": "confirmed"
}
```

不得把未经测试的抗菌、塑形、速干、环保、医疗或功能结论写成已证实卖点。
