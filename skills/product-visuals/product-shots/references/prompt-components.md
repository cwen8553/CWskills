# 可组合图片提示词

先填写真实参考绑定，再选择任务组件。花括号是变量，不是默认事实；无证据的变量删除或留在内部，不让模型自行补齐。

## 通用任务卡

```text
用途与画布：{placement, width_px, height_px}
产品真源：{product_reference_ids}；细节：{detail_reference_ids}
只用于风格：{style_reference_ids}；人物身份：{model_reference_ids}
必须保留：{silhouette, construction, zones, color, logo, label_position}
允许改变：{background, lighting, pose, camera}
视觉任务：{one_purchase_question}
构图：{subject_position, camera_height, crop, text_space}
光影材质：{lighting, texture, palette}
本次精确文案由排版处理：{approved_copy}
禁止：{unsupported_details, identity_drift, false_claim_symbols}
验收对照：{specific_visible_checks}
```

## 按需追加

- 主视觉：表现本品的真实使用情境；人物动作处在 {action_phase}，支撑点与物体接触正确，衣服清晰可辨。为标题保留 {text_space}。
- 三视图：{front/left_side/right_side/back}，统一相机高度、光线和尺度；标签以穿着者方位为准，背部结构只用对应真源。
- 多颜色：颜色由 {color_reference_id} 绑定；重新核对整件轮廓与细节，不从连续生成图自行换色。
- 细节大片：真实的 {collar/seam/texture/edge}，光线干净、纹理清楚、景深适度；局部能在整件中定位，不用通用面料替代。
- 人物返修：修正 {identified_proportion_or_contact_error}，保留 {product_and_identity_anchors}；重新建立合理透视，不非等比拉伸。
- 材料图：展示本品 {surface/layers} 与经证实的 {mechanism}；不暗示未经测试的功能，不画虚构证章。

非服装产品把领袖与侧标替换为瓶型、按钮、接口、部件、包装等真实结构；不强制套用服装场景。文字与 Logo 的精准实现服从宿主工具和可编辑排版能力。
