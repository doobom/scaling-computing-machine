# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

-   **目标用户**: 香港本地家庭消费者（母婴/日用采购）+ 后台运营人员；追求高效、信任感与在地化体验
-   **核心目的**: 建立「地道港式百货」信任感，引导快速下单与复购；后台保障履约效率
-   **情绪基调**: 前端：洁净、安心、生活气息 / 避免：廉价促销感、信息过载；后台：理性、秩序 / 避免：视觉疲劳

### 1.2 设计方向

-   **Design Style**: Soft Blocks 柔色块 — 港式电商需兼顾亲和力与信息密度，柔和圆角+浅灰分层营造干净货架感
-   **Application Type**: E-commerce (B2C + Admin) — 决定双端布局策略差异
-   **Aesthetic Direction**: 「现代港式洁净风」：白底为画布，深蓝导航定调信任，品牌绿点缀行动点，繁体中文排版疏朗有致

## 2. Color System (色彩系统)

> 基于「香港生活百货」在地化语义推导：深蓝呼应维港/专业信任，品牌绿呼应健康/活力/优惠，红色仅用于价格强刺激。

**色彩关系**: 深海军蓝主色 + 翡翠绿强调色 + 暖白背景 + 港红价格色
**配色设计理由**: 港式电商偏好高对比度清晰层级，深蓝传递正品信赖，绿色区分营销动作，符合本地支付/物流认知习惯
**主色推导**: Primary 选用深海军蓝，关联「跨境正品」「专业服务」心智，区别于通用电商蓝
**使用比例**: 60% 暖白背景 / 30% 深蓝导航与卡片结构 / 10% 品牌绿(CTA/状态) + 港红(价格)

### 2.1 主题颜色

| Token                | HSL 值                  | 说明                               |
| -------------------- | ----------------------- | ---------------------------------- |
| `background`         | hsl(40, 20%, 98%)       | 暖白底色，比纯白更护眼宜居         |
| `card`               | hsl(0, 0%, 100%)        | 纯白卡片，与暖白底形成微层次       |
| `foreground`         | hsl(220, 25%, 12%)      | 深墨蓝文字，繁体笔画清晰不糊       |
| `muted-foreground`   | hsl(220, 10%, 46%)      | 次要说明/划线价灰色                 |
| `primary`            | hsl(215, 65%, 22%)      | 深海军蓝，导航/主按钮/关键标题     |
| `primary-foreground` | hsl(0, 0%, 100%)        | 白色反字                            |
| `accent`             | hsl(160, 55%, 42%)      | 翡翠绿，hover/焦点/优惠标签/进度条 |
| `accent-foreground`  | hsl(0, 0%, 100%)        | 白色反字                            |
| `border`             | hsl(220, 15%, 90%)      | 极淡蓝灰边框，分隔但不抢戏         |
| `price`              | hsl(5, 78%, 52%)        | 港红，折后价/金额专用语义色        |
| `success`            | hsl(160, 55%, 42%)      | 复用 accent 绿，支付成功/有货      |
| `warning`            | hsl(38, 90%, 50%)       | 琥珀黄，库存预警/待付款            |
| `destructive`        | hsl(0, 72%, 51%)        | 正红，删除/关闭/缺货               |

### 2.2 导航区配色

-   **基调关系**: 深蓝实心导航 (`bg-primary`) + 白色文字图标，与浅色内容区强对比锚定顶部
-   **关键状态**: Hover 用 `bg-white/10` 半透明反馈；激活态用 `bg-accent` 绿色下划线或底色标记
-   **边界与背景**: 固定吸顶非透明；底部无阴影靠色块自然分隔；移动端汉堡菜单展开同色系

### 2.3 语义颜色

> 价格色 `price` 为核心业务语义色，独立于 destructive；状态色从基础色相偏移衍生，确保图表/标签与主色协调。

## 3. Typography (字体排版)

-   **Heading**: "Source Han Sans HK", "Noto Sans HK", system-ui, sans-serif
-   **Body**: "Source Han Sans HK", "Noto Sans HK", -apple-system, BlinkMacSystemFont, sans-serif
-   **Mono**: "Roboto Mono", "SF Mono", monospace (订单号/SKU/金额数字)
-   **字体策略**: 优先加载思源黑体 HK 变体适配繁体笔画；回退栈覆盖 macOS/iOS/Windows；数字强制等宽对齐价格列表

## 4. Layout Strategy (布局策略)

-   **导航意图**: 前端持久型顶部导航（分类多、搜索高频）；后台左侧 Sidebar（模块层级深）；至多一套全局导航，禁止并存
-   **页面架构**: 前端商城 `max-w-7xl` 居中容器；后台管理 `max-w-[1600px]` 宽幅；结算页 `max-w-3xl` 聚焦
-   **响应式**: 移动端筛选收为抽屉、商品网格 2 列、操作栏固定底部；桌面端充分利用横向空间展示多图/表格

## 5. Visual Language (视觉语言)

-   **形态参数**: 圆角 `rounded-lg (0.5rem)` · 阴影 `shadow-sm hover:shadow-md` · 间距基调 `standard (gap-4/p-6)`
-   **识别签名**: 商品卡悬停上浮 4px + 阴影加深；价格数字 Roboto Mono 右对齐；品牌绿胶囊标签标识优惠/状态
-   **装饰策略**: 仅用色块与微动效，禁用渐变飘带/复杂纹理/装饰插画；轮播图叠加半透明黑底保证文字可读
-   **动效原则**: 悬停/点击 200ms ease-out；页面切换 300ms fade；库存数字变化脉冲提示
-   **可及性**: 正文对比度 ≥ 4.5:1；深蓝底白字 ≥ 7:1；轮播图文案加 `bg-black/40` 遮罩；所有交互元素可见 focus ring

## 6. Component Principles (组件原则)

-   **状态完整性**: Button/Input/Card/Toggle 覆盖 Default/Hover/Focus/Active/Disabled；Focus 用 `ring-2 ring-accent ring-offset-2`
-   **层级清晰**: Primary=深蓝实心；Secondary=白底蓝边；Ghost=透明蓝文；价格=港红大字+灰色划线原价
-   **一致性**: 状态标签统一胶囊形 + 语义色背景；表单错误红框+下方文案；Toast 右上角弹出含图标
-   **双语适配**: 组件预留 1.3x 中文宽度；Tab/按钮文字过长自动截断+tooltip；中英文切换不破坏布局

## 7. Image Direction (图片与视觉资产，按需)

-   **Image Role**: Hero 轮播图 / 分类快捷入口图标 / 空状态插画 / 会员等级徽章
-   **Image Art Direction**: 产品摄影风格，明亮自然光，浅暖灰背景，构图居中留白，无过度后期；插画为线性扁平风，品牌绿+深蓝双色
-   **Image Prompt Keywords**: product photography, soft natural lighting, warm gray background, minimalist composition, clean negative space, hong kong lifestyle, maternal baby products, flat line illustration, teal and navy duotone
-   **Image Avoidance**: 通用科技感 3D 渲染、欧美面孔商务素材、高饱和霓虹渐变、带水印/文字合成图、AI 伪影明显的材质

## 8. 应避免 (Anti-patterns)

-   ❌ 使用紫色/橙色作为主色 — 偏离港式百货信任基调，与参考风格冲突
-   ❌ 商品列表密集堆砌无边距 — 违背 Soft Blocks 呼吸感原则，降低浏览舒适度
-   ❌ 后台照搬前台装饰动效 — 管理界面需克制，动画仅限状态反馈，禁用入场/悬浮装饰