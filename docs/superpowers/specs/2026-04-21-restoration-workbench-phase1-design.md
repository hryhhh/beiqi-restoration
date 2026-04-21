# 壁画修复工作台第一版落地设计

## 背景

仓库中已经存在 `壁画修复工作台设计` 文档，但当前代码仍缺少独立的修复工作台页面、独立的修复 API 封装、演示模式降级链路，以及把当前结果保存为 `restored` 图层的完整闭环。

本次设计用于收口第一版实际落地范围，目标是在不新增真实修复后端接口的前提下，完成前端完整流程、最小后端权限调整，以及后续接入真实接口时可直接替换的代码边界。

## 目标

- 新增独立的 `/restoration` 页面和导航入口。
- 让 `analysis` 与 `restoration` 在职责上明确分离。
- 支持完整闭环：选壁画、上传原图、整图修复或局部精修、生成主结果、继续生成变体、保存为 `restored` 图层。
- 优先尝试真实接口，失败时自动降级为前端演示模式。
- 放开保存所需的上传权限到 `admin`、`chief_restorer`、`assistant`、`researcher`。

## 非目标

- 本次不实现真实修复生成后端接口。
- 不引入修复结果历史时间轴、多版本管理或审批流。
- 不把修复工作台并入 `analysis` 页面。
- 不把完整病害标注编辑能力搬进修复工作台。

## 方案结论

采用独立工作台方案：

- 前端新增独立的 `restoration` 页面、类型、API 和 mock 生成逻辑。
- 保存结果时复用现有 `/api/murals/:id/images` 上传链路，以 `imageType=restored` 写回壁画。
- 后端本轮只调整上传权限，不新增 restoration handler。

这样可以先交付完整工作流，同时把真实接口接入点保留在 `frontend/src/api/restoration.ts` 内部，后续替换时不需要重写页面状态流。

## 架构与边界

### 路由与导航

- 新增受保护页面路由：`/restoration`
- 左侧导航新增菜单项：`壁画修复`
- 侧边栏高亮逻辑从精确匹配改为一级路由前缀匹配，确保后续 `/murals/:id`、`/projects/:id`、`/restoration` 等路径都能正确高亮

### 模块职责

- `analysis`
  - 负责病害检测、检测确认和转标注
- `restoration`
  - 负责修复参数配置、修复结果生成、变体生成和保存
- `murals`
  - 继续作为壁画数据和图层上传的唯一来源

### 权限边界

- 页面入口对 `admin`、`chief_restorer`、`assistant`、`researcher` 可见
- `reviewer` 不显示该页面入口
- `/api/murals/:id/images` 上传权限扩展到：
  - `admin`
  - `chief_restorer`
  - `assistant`
  - `researcher`

## 页面设计

页面采用上下流程式布局，拆分为 5 个区块。

### 1. 顶部上下文区

包含：

- 壁画选择器
- 当前壁画摘要卡
- 修复模式切换：`整图修复` / `局部精修`

行为：

- 切换壁画时清空上传原图、已选标注、手动选区、当前主结果、变体列表、演示模式标记
- 未选择壁画时不允许提交修复和保存

### 2. 参数区

参数区采用双层结构。

默认参数：

- 修复强度
- 去污程度
- 色彩还原
- 细节保留
- 裂隙修补倾向

高级参数按分组折叠展示：

- 结构修补
- 表面清理
- 色彩纹理
- 输出控制

实现原则：

- 默认参数足以完成一次生成
- 高级参数与默认参数归一到同一个 `RestorationParameters` 对象
- 第一版不暴露模型内部术语

### 3. 原图区

包含：

- 上传控件
- 原图预览
- 局部精修辅助区

局部精修有两条路径：

- 选择已有标注
- 使用手动临时选区

实现策略：

- 已有标注读取当前壁画 `visible` 图层的标注列表，支持多选
- 手动选区继续使用 `AnnotationCoordinates` 结构
- 手动选区只做临时状态，不创建正式标注记录
- 为控制复杂度，手动选区只提供单次矩形或多边形绘制

提交规则：

- `整图修复` 不要求选区
- `局部精修` 必须满足以下之一：
  - 至少选择一条已有标注
  - 已完成一组手动选区

### 4. 结果区

结果区分为三层：

- 顶部状态栏：显示 `真实生成` / `演示模式`、生成时间、当前模式
- 中部主结果区：使用现有 `ComparisonView` 展示原图与当前主结果的对比
- 底部变体区：显示变体缩略图，支持切换当前主结果

交互原则：

- 第一次生成只突出一个主结果
- 变体作为次级候选，不与主结果争夺视觉焦点
- 点击变体只替换当前主结果，不重置参数

### 5. 底部操作区

操作按钮：

- `开始修复`
- `再次生成变体`
- `确认保存为修复后图像`

行为规则：

- `开始修复`
  - 在生成中显示 loading
  - 前端直接拦截未选壁画、未上传原图、局部精修缺少选区的情况
- `再次生成变体`
  - 仅在已有主结果时启用
- `确认保存为修复后图像`
  - 仅对当前主结果生效
  - 保存成功后提供跳转到壁画详情页入口

## 数据模型

### 前端类型

新增独立 restoration 类型。

```ts
type RestorationMode = 'full' | 'partial';

interface RestorationParameters {
  restorationStrength: number;
  cleaningLevel: number;
  colorRecovery: number;
  detailPreservation: number;
  crackRepairBias: number;
  structureClosure: number;
  structureFill: number;
  edgeBlend: number;
  stainRemoval: number;
  moldSuppression: number;
  saltReduction: number;
  toneCorrection: number;
  localColorRepair: number;
  textureRebuild: number;
  outputPreference: 'clarity' | 'fidelity';
  randomness: number;
}

interface RestorationResult {
  id: string;
  imageUrl: string;
  isMock: boolean;
  createdAt: string;
  parametersSnapshot: RestorationParameters;
  sourceType: 'primary' | 'variant';
}
```

### 页面状态

页面至少维护以下状态：

- 当前壁画
- 当前原图文件与本地预览 URL
- 当前修复模式
- 参数对象
- 已选标注 ID 列表
- 手动选区坐标
- 当前主结果
- 变体列表
- 生成中、保存中状态

首版状态集中放在 `RestorationPage` 内部，不新增全局 store。

## API 与降级策略

### API 组织

新增 `frontend/src/api/restoration.ts`，不并入 `analysis.ts`。

提供两个主要方法：

- `generateRestoration(payload)`
- `generateRestorationVariant(payload)`

### 调用策略

前端先尝试真实接口：

- `POST /api/restoration/generate`

如果出现以下情况，则自动降级到本地 mock：

- `404`
- `501`
- 网络错误
- 超时

页面拿到的始终是统一的 `RestorationResult`，不区分真实结果与 mock 结果的调用链。

## Mock 生成策略

第一版 mock 生成由前端本地完成，目标不是伪造 AI，而是生成一张可解释、可感知变化、可继续保存的结果图。

### 整图修复

基于 canvas 对原图执行组合处理：

- 亮度微调
- 对比度提升
- 饱和度提升
- 暖色偏移
- 轻微柔化与锐化平衡

### 局部精修

仅对以下区域应用更强修复处理：

- 已选标注的包围盒区域
- 手动选区圈定区域

未选区域尽量保持原样，确保局部精修结果与整图修复有明显区别。

### 变体生成

- 基于当前参数和当前主结果继续生成
- 在参数上引入小幅扰动，保证各变体彼此可区分
- 扰动范围受限，避免变体结果过于失真

## 保存方案

第一版不新增“确认保存”专用后端接口。

保存流程：

1. 读取当前主结果图
2. 若为 data URL，则转成 `Blob`
3. 包装成 `File`
4. 调用现有 `uploadMuralImage(muralId, file, 'restored')`

文件命名规则：

- `restoration-<muralId>-<timestamp>.png`

保存失败时：

- 保留当前结果
- 保留当前参数
- 允许用户直接重试

## 关键实现文件

前端预期新增或修改的主要文件：

- `frontend/src/router/index.tsx`
- `frontend/src/layouts/MainLayout.tsx`
- `frontend/src/api/restoration.ts`
- `frontend/src/types/restoration.ts`
- `frontend/src/pages/restoration/RestorationPage.tsx`
- `frontend/src/pages/restoration/restoration.css`
- `frontend/src/utils/restorationMock.ts`
- `frontend/src/utils/imageUtils.ts`
- `frontend/src/types/index.ts`

后端预期修改文件：

- `backend/cmd/server/main.go`

如实现中发现 `AnnotationCanvas` 复用成本过高，可补一个局部选区专用组件，但应优先保持写入范围聚焦。

## 测试与验证

### 前端验证重点

- 进入 `/restoration` 后能正确加载壁画列表
- 选择壁画后可上传原图并生成整图修复结果
- 局部精修可通过“已有标注”路径提交
- 局部精修可通过“手动选区”路径提交
- 真实接口不可用时自动降级为演示模式
- 主结果生成后可继续生成变体并切换主结果
- 当前主结果可保存为 `restored` 图层
- 切换壁画后旧状态全部清空

### 后端回归重点

- `admin`、`chief_restorer`、`assistant`、`researcher` 可上传壁画图像
- `reviewer` 仍不能上传壁画图像

## 风险与控制

- `AnnotationCanvas` 是复杂组件，本轮只复用选区绘制和坐标回传，不复用完整编辑流
- mock 结果统一输出 PNG，避免浏览器 MIME 差异带来的上传问题
- 页面状态较重，需要把 API、mock 算法和类型从页面中拆出，避免单文件膨胀
- 若保存接口失败，不得清空用户本次生成结果

## 实施顺序

1. 接入路由、导航与权限范围
2. 完成 restoration 类型、API 封装和 mock 生成工具
3. 完成工作台页面结构与交互
4. 接通已有标注与手动选区
5. 接通变体生成与保存链路
6. 回归验证角色权限与闭环路径
