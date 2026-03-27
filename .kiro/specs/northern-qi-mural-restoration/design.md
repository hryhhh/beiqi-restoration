# 设计文档

## 概述

北齐壁蕴系统（Northern Qi Mural Guardian）是一个全栈 Web 应用，采用前后端分离架构，分为两个独立项目：

- **前端项目 (`beiqi-mural-guardian/frontend/`)**：React 18 + TypeScript + Vite，SPA 应用
- **后端项目 (`beiqi-mural-guardian/backend/`)**：Go (Gin) + PostgreSQL + GORM

系统遵循《古代壁画保护修复档案规范》（GB/T 30235），确保数据安全和操作可追溯。

## 架构

### 整体架构

```
┌──────────────────────────────────────────────────────┐
│                  前端 (React SPA)                      │
│  Vite + React 18 + TypeScript + Zustand + Ant Design │
│  + Tailwind CSS + Fabric.js (标注) + ECharts (图表)   │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP/REST + JWT
┌──────────────────────▼───────────────────────────────┐
│                   后端 (Go API)                        │
│  Gin + GORM + PostgreSQL + JWT + Zap (日志)           │
│  + imaging (图像处理) + excelize (Excel)              │
└──────────┬───────────────────────┬───────────────────┘
           │                       │
┌──────────▼──────────┐  ┌────────▼──────────────────┐
│   PostgreSQL 数据库   │  │   文件存储 (本地/对象存储)  │
│   GORM 管理 Schema   │  │   壁画图像 + 附件 + 文档   │
└─────────────────────┘  └───────────────────────────┘
```

### 前端项目结构 (`beiqi-mural-guardian/frontend/`)

```
frontend/
├── src/
│   ├── api/                  # API 请求封装（axios 实例、各模块 api.ts）
│   ├── assets/               # 静态资源
│   │   ├── images/           # 壁画示例、图标等
│   │   ├── fonts/            # 仿古字体（可选）
│   │   └── styles/           # 全局 CSS / Tailwind 基础样式
│   ├── components/           # 通用组件
│   │   ├── common/           # Button, Modal, Table 等基础组件
│   │   ├── layout/           # Header, Sidebar, Footer 等布局组件
│   │   ├── annotation/       # 病害标注相关（Fabric.js 画布、工具栏、侧边面板）
│   │   ├── comparison/       # 修复前后对比（并排、滑动叠加）
│   │   ├── ui/               # ProCard, StatsCard 等业务 UI 组件
│   │   └── form/             # 自定义表单组件（病害类型选择器等）
│   ├── features/             # 按业务领域组织（每个 feature 含自己的 components/hooks/types）
│   │   ├── mural/            # 壁画库相关（list, detail, form）
│   │   ├── project/          # 修复项目（list, detail, kanban）
│   │   ├── annotation/       # 标注业务逻辑
│   │   ├── analysis/         # AI 图像分析
│   │   └── knowledge/        # 知识库
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useMural.ts
│   │   ├── useAnnotation.ts  # 标注状态、保存等
│   │   └── useImageCompare.ts
│   ├── layouts/              # 页面级布局（MainLayout, AuthLayout, AdminLayout）
│   ├── pages/                # 路由页面（保持简单，只放页面入口）
│   │   ├── landing/          # 官网首页
│   │   ├── auth/             # 登录/注册
│   │   ├── dashboard/        # 仪表盘
│   │   ├── murals/           # 壁画库
│   │   ├── projects/         # 修复项目
│   │   ├── analysis/         # 图像分析
│   │   ├── knowledge/        # 知识库
│   │   └── admin/            # 管理后台
│   ├── router/               # React Router 路由配置 + 权限守卫（ProtectedRoute）
│   ├── stores/               # Zustand 状态管理（user, theme, currentMural 等）
│   ├── types/                # TypeScript 类型定义（按模块分文件：mural.ts, annotation.ts 等）
│   ├── utils/                # 工具函数
│   │   ├── imageUtils.ts     # 坐标转换、缩略图处理
│   │   ├── formatter.ts      # 病害文本格式化、序列化
│   │   └── validators.ts     # 校验工具
│   └── constants/            # 常量定义（病害类型枚举、修复阶段列表、权限枚举）
├── public/                   # 静态文件（favicon、manifest）
├── .env                      # 环境变量
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### 后端项目结构 (`beiqi-mural-guardian/backend/`)

```
backend/
├── cmd/
│   └── server/
│       └── main.go               # 入口：加载配置、依赖注入、启动服务器
├── internal/
│   ├── config/                   # 配置加载（viper 或 env）
│   ├── middleware/               # JWT、RBAC、CORS、审计日志、Rate Limit
│   ├── handler/                  # HTTP 处理器（薄层，只负责请求响应）
│   │   ├── auth.go
│   │   ├── mural.go
│   │   ├── annotation.go
│   │   ├── project.go
│   │   ├── plan.go
│   │   ├── analysis.go
│   │   ├── knowledge.go
│   │   ├── admin.go
│   │   └── public.go
│   ├── service/                  # 业务逻辑层（核心用例）
│   ├── repository/               # 数据访问层（GORM）
│   ├── model/                    # GORM 数据库模型（实体）
│   ├── domain/                   # 纯业务领域模型（不依赖 GORM/DB）
│   │   ├── mural.go
│   │   ├── annotation.go
│   │   ├── project.go
│   │   └── user.go
│   ├── ports/                    # 接口定义（RepositoryPort, ServicePort 等，Hexagonal 架构）
│   ├── serializer/               # JSON 序列化、反序列化、文本格式化（需求 10）
│   ├── validator/                # 请求校验（validator.v10）
│   ├── dto/                      # 请求/响应 DTO（避免 model 直接暴露）
│   └── util/                     # 通用工具
├── pkg/                          # 可公开复用的包
│   ├── response/                 # 统一响应格式
│   ├── jwt/                      # JWT 工具
│   ├── hash/                     # 密码哈希 + 文件哈希
│   ├── imaging/                  # 图像处理（缩略图、WebP、哈希）
│   ├── logger/                   # 结构化日志（zap）
│   └── storage/                  # 文件存储抽象（local / OSS / S3）
├── migrations/                   # 数据库迁移（golang-migrate）
├── uploads/                      # 文件上传目录（不提交 git）
├── scripts/                      # 部署、备份、种子数据脚本
├── test/                         # 集成测试
├── docs/                         # API 文档（Swagger/OpenAPI）
├── go.mod
├── go.sum
├── Makefile                      # 常用命令（build, migrate, test, seed）
└── .env.example
```

### 根目录结构 (`beiqi-mural-guardian/`)

```
beiqi-mural-guardian/
├── frontend/                     # 前端项目
├── backend/                      # 后端项目
├── .gitignore
├── README.md                     # 项目概述、启动命令、联调说明
├── docker-compose.yml            # 开发环境（PostgreSQL + 文件存储）
├── Makefile                      # 根级命令（make dev, make build-fe, make build-be）
└── LICENSE
```

## 组件与接口

### 前端核心组件

**标注工具组件 (AnnotationCanvas)**
- 基于 Fabric.js 实现画布渲染
- 支持多边形、矩形、自由路径三种绘制模式
- 标注数据使用相对坐标（0-1 范围），精度四位小数
- 支持多图层切换（可见光、红外、紫外）
- 自动计算标注区域面积占比
- 大图分块加载：使用 OpenSeadragon 做底层瓦片化渲染（后端生成 DZI 格式金字塔瓦片），Fabric.js 作为叠加层负责标注绘制，两层通过视口同步联动
- 离线缓存：使用 IndexedDB 存储未同步的标注操作，每条记录包含操作类型、标注数据、本地时间戳和对应的服务端版本号。网络恢复后自动同步，冲突处理策略为"版本号比对 + 用户确认"——若服务端版本号大于本地缓存的版本号，弹窗展示本地版本与服务端版本的差异，由用户选择保留哪个版本；若版本号一致则直接提交

**修复对比组件 (ComparisonView)**
- 并排模式：两张图像左右排列，同步缩放和平移
- 滑块模式：叠加两张图像，拖动滑块显示过渡效果
- 缺失图像时显示占位提示

**仪表盘图表组件 (DashboardCharts)**
- 基于 ECharts 渲染壁画状态分布饼图和修复进度趋势折线图
- 健康指数预警卡片

**官网首页 (LandingPage)**
- 英雄区：全屏壁画背景 + 暗色叠加层 + 标题文案 + 双按钮
- 系统简介区：介绍文案 + 功能截图
- 核心功能亮点区：6 张卡片网格
- 文化价值区：壁画高清图 + 文案
- 响应式布局，主色 #8B2E2E

### 角色权限映射

| 功能模块 | 管理员 (admin) | 首席修复师 (chief_restorer) | 助理修复师 (assistant) | 研究员 (researcher) | 审核员 (reviewer) |
|---------|:-:|:-:|:-:|:-:|:-:|
| 官网首页 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 仪表盘 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 壁画库 - 查看 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 壁画库 - 创建/编辑 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 壁画库 - 批量导入 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 病害标注 - 查看 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 病害标注 - 创建/编辑/删除 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 修复项目 - 查看 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 修复项目 - 创建/编辑 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 修复项目 - 任务分配 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 修复项目 - 任务状态更新 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 修复方案 - 创建/编辑 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 修复方案 - 审批 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 图像分析 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 知识库 - 查看/搜索 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 知识库 - 上传文档 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 管理后台 | ✅ | ❌ | ❌ | ❌ | ❌ |

首席修复师与研究员的核心区别：首席修复师可以创建/编辑壁画记录、创建/管理修复项目和分配任务，研究员只能查看和进行标注操作。

### 后端 API 接口

**统一响应格式**

所有 API 响应遵循统一格式：
```json
// 成功响应
{ "code": 0, "message": "success", "data": { ... } }

// 分页响应
{ "code": 0, "message": "success", "data": { "data": [...], "total": 100, "page": 1, "pageSize": 20 } }

// 错误响应
{ "code": 40001, "message": "校验失败", "details": { "name": "名称不能为空" } }
```

分页请求统一使用查询参数 `?page=1&pageSize=20`，page 从 1 开始，pageSize 默认 20。

**认证模块 `/api/auth`**
- `POST /login` — 用户登录，返回 JWT 令牌（含角色信息）
- `POST /register` — 用户注册
- `POST /reset-password` — 请求密码重置
- `POST /reset-password/confirm` — 确认密码重置

**壁画模块 `/api/murals`**
- `GET /` — 获取壁画列表（支持筛选、分页）
- `POST /` — 创建壁画记录
- `GET /:id` — 获取壁画详情
- `PUT /:id` — 更新壁画记录
- `POST /:id/images` — 上传壁画图像
- `GET /:id/history` — 获取修改历史
- `POST /batch-import` — 批量导入

**病害标注模块 `/api/murals/:muralId/annotations`**
- `GET /` — 获取壁画的所有标注（支持 `?imageLayer=visible` 按图层筛选）
- `POST /` — 创建标注
- `PUT /:id` — 更新标注
- `DELETE /:id` — 删除标注
- `GET /:id/versions` — 获取标注版本历史

**修复项目模块 `/api/projects`**
- `GET /` — 获取项目列表（支持状态筛选）
- `POST /` — 创建项目（自动初始化七阶段流程）
- `GET /:id` — 获取项目详情（含任务和阶段）
- `PUT /:id` — 更新项目
- `POST /:id/tasks` — 创建任务
- `PUT /:id/tasks/:taskId` — 更新任务状态（自动重算进度）
- `PUT /:id/tasks/:taskId/assign` — 分配任务负责人
- `POST /:id/tasks/:taskId/attachments` — 上传任务附件
- `POST /:id/materials` — 记录材料消耗
- `PUT /:id/complete` — 标记项目完成（校验未完成任务）

**修复方案模块 `/api/plans`**
- `GET /` — 获取方案列表（支持 `?annotationId=xxx` 按标注筛选）
- `GET /:id` — 获取方案详情
- `POST /` — 创建修复方案（校验病害标注存在性）
- `PUT /:id` — 更新方案状态
- `POST /:id/review` — 审批方案（仅审核员）

**修复对比模块 `/api/murals/:muralId/comparison`**
- `GET /versions` — 获取壁画的所有图像版本
- `POST /upload-restored` — 上传修复后图像

**图像分析模块 `/api/analysis`**
- `POST /detect` — 上传图像进行 AI 检测
- `POST /confirm` — 确认检测结果转为标注
- `POST /report` — 生成修复报告

**知识库模块 `/api/knowledge`**
- `GET /` — 获取文档列表（支持分类筛选）
- `GET /search` — 搜索文档
- `POST /` — 上传文档（仅管理员）
- `GET /:id` — 获取文档详情

**管理模块 `/api/admin`**
- `GET /users` — 获取用户列表
- `PUT /users/:id/role` — 修改用户角色
- `GET /logs` — 获取操作日志（支持按用户、操作类型筛选）
- `POST /backup` — 触发数据备份
- `POST /export` — 导出数据（Excel/PDF-A）

**仪表盘模块 `/api/dashboard`**
- `GET /summary` — 汇总数据（待办任务数、进行中项目数、壁画总数）
- `GET /alerts` — 健康指数预警列表（低于阈值的壁画）
- `GET /charts` — 图表数据（壁画状态分布、修复进度趋势）

**公开接口 `/api/public`**
- `GET /landing` — 获取官网首页数据（精选壁画、统计数据）

## 数据模型

### Go 模型定义

```go
// 用户角色枚举
type UserRole string
const (
    RoleAdmin         UserRole = "admin"           // 管理员
    RoleChiefRestorer UserRole = "chief_restorer"  // 首席修复师
    RoleAssistant     UserRole = "assistant"        // 助理修复师
    RoleResearcher    UserRole = "researcher"       // 研究员
    RoleReviewer      UserRole = "reviewer"         // 审核员
)

// 用户
type User struct {
    ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    Username  string    `gorm:"uniqueIndex;not null" json:"username"`
    Email     string    `gorm:"uniqueIndex;not null" json:"email"`
    Password  string    `gorm:"not null" json:"-"` // bcrypt 哈希，不序列化
    Role      UserRole  `gorm:"type:varchar(20);default:'researcher'" json:"role"`
    Avatar    *string   `json:"avatar"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}

// 密码重置令牌
type PasswordResetToken struct {
    ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    UserID    string    `gorm:"type:uuid;not null;index" json:"userId"`
    Token     string    `gorm:"uniqueIndex;not null" json:"-"`
    Used      bool      `gorm:"default:false" json:"used"`
    ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
    CreatedAt time.Time `json:"createdAt"`
}

// 壁画状态枚举
type MuralStatus string
const (
    MuralRegistered MuralStatus = "registered" // 已登记
    MuralAssessing  MuralStatus = "assessing"  // 评估中
    MuralRestoring  MuralStatus = "restoring"  // 修复中
    MuralCompleted  MuralStatus = "completed"  // 已完成
    MuralMonitoring MuralStatus = "monitoring" // 监测中
)

// 壁画记录
type Mural struct {
    ID             string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    Name           string      `gorm:"not null" json:"name"`
    Era            string      `gorm:"not null" json:"era"`
    Site           string      `gorm:"not null" json:"site"`
    Material       string      `gorm:"not null" json:"material"`
    TombLocation   *string     `json:"tombLocation"`   // 墓道/墓室/甬道
    ExcavationDate *time.Time  `json:"excavationDate"`
    Dimensions     *string     `json:"dimensions"`
    Description    *string     `json:"description"`
    Status         MuralStatus `gorm:"type:varchar(20);default:'registered'" json:"status"`
    HealthIndex    *float64    `json:"healthIndex"`    // 0-100
    IsFeatured     bool        `gorm:"default:false" json:"isFeatured"`
    CreatedAt      time.Time   `json:"createdAt"`
    UpdatedAt      time.Time   `json:"updatedAt"`

    Images      []MuralImage       `gorm:"foreignKey:MuralID" json:"images,omitempty"`
    Annotations []DamageAnnotation  `gorm:"foreignKey:MuralID" json:"annotations,omitempty"`
}

// 图像类型枚举
type ImageType string
const (
    ImageVisible    ImageType = "visible"    // 可见光
    ImageInfrared   ImageType = "infrared"   // 红外
    ImageUltraviolet ImageType = "ultraviolet" // 紫外
    ImageRestored   ImageType = "restored"   // 修复后
)

// 壁画图像
type MuralImage struct {
    ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    MuralID       string    `gorm:"type:uuid;not null;index" json:"muralId"`
    FilePath      string    `gorm:"not null" json:"filePath"`
    FileHash      string    `gorm:"not null" json:"fileHash"` // SHA-256
    ImageType     ImageType `gorm:"type:varchar(20);default:'visible'" json:"imageType"`
    Version       int       `gorm:"default:1" json:"version"`
    Width         int       `json:"width"`
    Height        int       `json:"height"`
    FileSize      int64     `json:"fileSize"`
    ThumbnailPath *string   `json:"thumbnailPath"`
    WebpPath      *string   `json:"webpPath"`
    CreatedAt     time.Time `json:"createdAt"`
}

// 病害类型枚举
type DamageType string
const (
    // 结构类
    DamageDetachment       DamageType = "detachment"        // 空鼓
    DamageFlaking          DamageType = "flaking"            // 起甲
    DamageSaltEfflorescence DamageType = "salt_efflorescence" // 酥碱
    DamageCracking         DamageType = "cracking"           // 龟裂/裂缝
    // 表面类
    DamagePigmentLoss      DamageType = "pigment_loss"       // 颜料层脱落
    DamageFading           DamageType = "fading"             // 褪色/变色
    DamageSoiling          DamageType = "soiling"            // 壁面污染
    // 生物类
    DamageMold             DamageType = "mold"               // 霉斑/菌害
    DamageInsect           DamageType = "insect_damage"      // 昆虫/动物危害
    DamageRoot             DamageType = "root_damage"        // 植物根系破坏
)

// 标注坐标数据结构
type AnnotationCoordinates struct {
    Type   string      `json:"type"`   // "polygon", "rect", "path"
    Points [][]float64 `json:"points"` // 相对坐标点数组，精度四位小数
}

// 病害标注
type DamageAnnotation struct {
    ID          string                `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    MuralID     string                `gorm:"type:uuid;not null;index" json:"muralId"`
    ImageLayer  ImageType             `gorm:"type:varchar(20);default:'visible'" json:"imageLayer"`
    DamageType  DamageType            `gorm:"type:varchar(30);not null" json:"damageType"`
    Severity    int                   `gorm:"not null" json:"severity"` // 1-5
    Coordinates datatypes.JSON        `gorm:"type:jsonb;not null" json:"coordinates"`
    Area        *float64              `json:"area"`
    AreaPercent *float64              `json:"areaPercent"`
    Description *string               `json:"description"`
    Version     int                   `gorm:"default:1" json:"version"`
    CreatedAt   time.Time             `json:"createdAt"`
    UpdatedAt   time.Time             `json:"updatedAt"`
}

// 标注版本快照
type AnnotationSnapshot struct {
    ID           string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    AnnotationID string         `gorm:"type:uuid;not null;index" json:"annotationId"`
    Version      int            `json:"version"`
    Coordinates  datatypes.JSON `gorm:"type:jsonb;not null" json:"coordinates"`
    DamageType   DamageType     `gorm:"type:varchar(30)" json:"damageType"`
    Severity     int            `json:"severity"`
    CreatedAt    time.Time      `json:"createdAt"`
}

// 项目状态枚举
type ProjectStatus string
const (
    ProjectPending    ProjectStatus = "pending"     // 待评估
    ProjectInProgress ProjectStatus = "in_progress" // 修复中
    ProjectCompleted  ProjectStatus = "completed"   // 已完成
)

// 阶段状态枚举
type PhaseStatus string
const (
    PhasePending    PhaseStatus = "pending"     // 待开始
    PhaseInProgress PhaseStatus = "in_progress" // 进行中
    PhaseCompleted  PhaseStatus = "completed"   // 已完成
)

// 任务状态枚举
type TaskStatus string
const (
    TaskPending    TaskStatus = "pending"     // 待处理
    TaskInProgress TaskStatus = "in_progress" // 进行中
    TaskCompleted  TaskStatus = "completed"   // 已完成
)

// 审批结果枚举
type ReviewResult string
const (
    ReviewApproved ReviewResult = "approved" // 通过
    ReviewRejected ReviewResult = "rejected" // 驳回
)

// 修复项目
type Project struct {
    ID          string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    Name        string        `gorm:"not null" json:"name"`
    Description *string       `json:"description"`
    Status      ProjectStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
    Progress    float64       `gorm:"default:0" json:"progress"` // 0-100
    Budget      *float64      `json:"budget"`
    StartDate   *time.Time    `json:"startDate"`
    EndDate     *time.Time    `json:"endDate"`
    CreatedAt   time.Time     `json:"createdAt"`
    UpdatedAt   time.Time     `json:"updatedAt"`

    Murals    []Mural        `gorm:"many2many:project_murals" json:"murals,omitempty"`
    Phases    []ProjectPhase `gorm:"foreignKey:ProjectID" json:"phases,omitempty"`
    Materials []MaterialRecord `gorm:"foreignKey:ProjectID" json:"materials,omitempty"`
}

// 项目阶段
type ProjectPhase struct {
    ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    ProjectID string      `gorm:"type:uuid;not null;index" json:"projectId"`
    Name      string      `gorm:"not null" json:"name"`
    Order     int         `json:"order"`
    Status    PhaseStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
    CreatedAt time.Time   `json:"createdAt"`
    UpdatedAt time.Time   `json:"updatedAt"`

    Tasks []RestTask `gorm:"foreignKey:PhaseID" json:"tasks,omitempty"`
}

// 修复任务
type RestTask struct {
    ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    PhaseID     string     `gorm:"type:uuid;not null;index" json:"phaseId"`
    Title       string     `gorm:"not null" json:"title"`
    Description *string    `json:"description"`
    Status      TaskStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`

    Assignees   []User           `gorm:"many2many:task_assignments" json:"assignees,omitempty"`
    Attachments []TaskAttachment `gorm:"foreignKey:TaskID" json:"attachments,omitempty"`
}

// 任务附件
type TaskAttachment struct {
    ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    TaskID    string    `gorm:"type:uuid;not null;index" json:"taskId"`
    FilePath  string    `gorm:"not null" json:"filePath"`
    FileName  string    `gorm:"not null" json:"fileName"`
    FileSize  int64     `json:"fileSize"`
    CreatedAt time.Time `json:"createdAt"`
}

// 修复方案状态枚举
type PlanStatus string
const (
    PlanDraft      PlanStatus = "draft"
    PlanPending    PlanStatus = "pending"
    PlanApproved   PlanStatus = "approved"
    PlanRejected   PlanStatus = "rejected"
    PlanInProgress PlanStatus = "in_progress"
    PlanCompleted  PlanStatus = "completed"
)

// 修复方案
type RestorationPlan struct {
    ID             string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    AnnotationID   string     `gorm:"type:uuid;not null;index" json:"annotationId"`
    Method         string     `gorm:"not null" json:"method"`
    Materials      string     `gorm:"not null" json:"materials"`
    ExpectedResult *string    `json:"expectedResult"`
    Status         PlanStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`
    CreatedAt      time.Time  `json:"createdAt"`
    UpdatedAt      time.Time  `json:"updatedAt"`

    Reviews       []PlanReview       `gorm:"foreignKey:PlanID" json:"reviews,omitempty"`
    StatusChanges []PlanStatusChange `gorm:"foreignKey:PlanID" json:"statusChanges,omitempty"`
}

// 方案审批
type PlanReview struct {
    ID         string       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    PlanID     string       `gorm:"type:uuid;not null;index" json:"planId"`
    ReviewerID string       `gorm:"type:uuid;not null" json:"reviewerId"`
    Result     ReviewResult `gorm:"type:varchar(10);not null" json:"result"`
    Comment    *string      `json:"comment"`
    CreatedAt  time.Time    `json:"createdAt"`
}

// 方案状态变更
type PlanStatusChange struct {
    ID         string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    PlanID     string     `gorm:"type:uuid;not null;index" json:"planId"`
    FromStatus PlanStatus `gorm:"type:varchar(20)" json:"fromStatus"`
    ToStatus   PlanStatus `gorm:"type:varchar(20)" json:"toStatus"`
    ChangedAt  time.Time  `gorm:"default:now()" json:"changedAt"`
}

// 材料消耗
type MaterialRecord struct {
    ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    ProjectID string    `gorm:"type:uuid;not null;index" json:"projectId"`
    Name      string    `gorm:"not null" json:"name"`
    Quantity  float64   `json:"quantity"`
    Unit      string    `json:"unit"`
    Cost      *float64  `json:"cost"`
    CreatedAt time.Time `json:"createdAt"`
}

// 壁画修改历史
type MuralHistory struct {
    ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    MuralID   string    `gorm:"type:uuid;not null;index" json:"muralId"`
    Field     string    `gorm:"not null" json:"field"`
    OldValue  *string   `json:"oldValue"`
    NewValue  *string   `json:"newValue"`
    ChangedBy string    `gorm:"not null" json:"changedBy"`
    ChangedAt time.Time `gorm:"default:now()" json:"changedAt"`
}

// 知识库文档分类
type DocCategory string
const (
    DocStandardProcess DocCategory = "standard_process" // 标准流程
    DocMaterialManual  DocCategory = "material_manual"  // 材料手册
    DocCaseStudy       DocCategory = "case_study"       // 案例库
    DocRegulation      DocCategory = "regulation"       // 法规文件
)

// 知识库文档
type KnowledgeDoc struct {
    ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    Title     string      `gorm:"not null" json:"title"`
    Content   string      `gorm:"type:text" json:"content"` // Markdown
    Category  DocCategory `gorm:"type:varchar(30);not null" json:"category"`
    FilePath  *string     `json:"filePath"`
    CreatedAt time.Time   `json:"createdAt"`
    UpdatedAt time.Time   `json:"updatedAt"`
}

// 操作日志
type AuditLog struct {
    ID         string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    UserID     string          `gorm:"type:uuid;not null;index" json:"userId"`
    Action     string          `gorm:"not null" json:"action"`
    TargetType string          `gorm:"not null" json:"targetType"` // mural/project/annotation 等
    TargetID   string          `gorm:"not null" json:"targetId"`
    Details    datatypes.JSON  `gorm:"type:jsonb" json:"details"`
    IPAddress  *string         `json:"ipAddress"`
    CreatedAt  time.Time       `json:"createdAt"`

    User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
```

### TypeScript 类型定义（前端共享类型）

```typescript
// ========== 枚举类型 ==========

// 用户角色
type UserRole = 'admin' | 'chief_restorer' | 'assistant' | 'researcher' | 'reviewer';

// 壁画状态
type MuralStatus = 'registered' | 'assessing' | 'restoring' | 'completed' | 'monitoring';

// 图像类型
type ImageType = 'visible' | 'infrared' | 'ultraviolet' | 'restored';

// 病害类型
type DamageType =
  // 结构类
  | 'detachment' | 'flaking' | 'salt_efflorescence' | 'cracking'
  // 表面类
  | 'pigment_loss' | 'fading' | 'soiling'
  // 生物类
  | 'mold' | 'insect_damage' | 'root_damage';

// 项目状态
type ProjectStatus = 'pending' | 'in_progress' | 'completed';

// 阶段状态
type PhaseStatus = 'pending' | 'in_progress' | 'completed';

// 任务状态
type TaskStatus = 'pending' | 'in_progress' | 'completed';

// 修复方案状态
type PlanStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

// 审批结果
type ReviewResult = 'approved' | 'rejected';

// 知识库文档分类
type DocCategory = 'standard_process' | 'material_manual' | 'case_study' | 'regulation';

// ========== 通用类型 ==========

// 统一分页请求参数
interface PaginationParams {
  page: number;      // 从 1 开始
  pageSize: number;  // 默认 20
}

// 统一分页响应格式
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 统一 API 响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 统一错误响应格式
interface ApiError {
  code: number;
  message: string;
  details?: Record<string, string>; // 字段级错误信息
}

// ========== 用户模块 ==========

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 壁画模块 ==========

interface MuralRecord {
  id: string;
  name: string;
  era: string;
  site: string;
  material: string;
  tombLocation?: string;
  excavationDate?: string;
  dimensions?: string;
  description?: string;
  status: MuralStatus;
  healthIndex?: number;
  isFeatured: boolean;
  images: MuralImage[];
  createdAt: string;
  updatedAt: string;
}

interface MuralImage {
  id: string;
  muralId: string;
  filePath: string;
  fileHash: string;
  imageType: ImageType;
  version: number;
  width: number;
  height: number;
  fileSize: number;
  thumbnailPath?: string;
  webpPath?: string;
  createdAt: string;
}

interface MuralHistory {
  id: string;
  muralId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
}

// ========== 病害标注模块 ==========

interface AnnotationCoordinates {
  type: 'polygon' | 'rect' | 'path';
  points: number[][]; // 相对坐标，精度四位小数
}

interface DamageAnnotation {
  id: string;
  muralId: string;
  imageLayer: ImageType;
  damageType: DamageType;
  severity: number; // 1-5
  coordinates: AnnotationCoordinates;
  area?: number;
  areaPercent?: number;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface AnnotationSnapshot {
  id: string;
  annotationId: string;
  version: number;
  coordinates: AnnotationCoordinates;
  damageType: DamageType;
  severity: number;
  createdAt: string;
}

// ========== 修复项目模块 ==========

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress: number; // 0-100
  budget?: number;
  startDate?: string;
  endDate?: string;
  murals?: MuralRecord[];
  phases?: ProjectPhase[];
  materials?: MaterialRecord[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  order: number;
  status: PhaseStatus;
  tasks?: RestTask[];
  createdAt: string;
  updatedAt: string;
}

interface RestTask {
  id: string;
  phaseId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignees?: User[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface TaskAttachment {
  id: string;
  taskId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

interface MaterialRecord {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  createdAt: string;
}

// ========== 修复方案模块 ==========

interface RestorationPlan {
  id: string;
  annotationId: string;
  method: string;
  materials: string;
  expectedResult?: string;
  status: PlanStatus;
  reviews?: PlanReview[];
  statusChanges?: PlanStatusChange[];
  createdAt: string;
  updatedAt: string;
}

interface PlanReview {
  id: string;
  planId: string;
  reviewerId: string;
  result: ReviewResult;
  comment?: string;
  createdAt: string;
}

interface PlanStatusChange {
  id: string;
  planId: string;
  fromStatus: PlanStatus;
  toStatus: PlanStatus;
  changedAt: string;
}

// ========== 知识库模块 ==========

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string; // Markdown
  category: DocCategory;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 管理后台模块 ==========

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: User;
}
```

### 序列化格式定义

**标注数据文本格式（用于可读文本导出/导入）：**

```
[标注ID] 病害类型:cracking | 严重程度:3 | 图层:visible
区域类型:polygon
坐标点: (0.1234,0.5678), (0.2345,0.6789), (0.3456,0.7890)
面积占比: 2.35%
描述: 墓室北壁中部纵向裂缝
---
```

每条标注以 `---` 分隔，解析时按此格式还原为 `DamageAnnotation` 对象。

## 错误处理

### 前端错误处理

- **API 请求错误**：axios 拦截器统一处理 HTTP 错误码，401 自动跳转登录页，403 显示权限不足提示，500 显示服务器错误通知
- **表单校验错误**：使用 Ant Design Form 校验 + Zod schema 双重校验，实时显示字段级错误信息
- **标注工具错误**：坐标越界自动裁剪到 [0, 1] 范围；绘制操作失败时回滚到上一状态
- **文件上传错误**：文件大小超限、格式不支持时显示明确提示
- **离线状态**：检测网络状态，离线时标注数据存入 IndexedDB，恢复后自动同步并提示用户

### 后端错误处理

- **统一错误响应格式**：
```go
type ErrorResponse struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Details interface{} `json:"details,omitempty"`
}
```
- **校验失败**：返回 400，details 中包含每个不合规字段的具体错误信息
- **认证失败**：返回 401，message 区分"凭据无效"和"令牌过期"
- **权限不足**：返回 403，message 说明所需角色
- **资源不存在**：返回 404，message 说明资源类型和 ID
- **业务规则冲突**：返回 409（如项目存在未完成任务时尝试标记完成）
- **AI 服务不可用**：返回 503，前端降级为手动标注模式
- **数据库操作失败**：记录错误日志（Zap），返回 500 通用错误（不暴露内部细节）

## 正确性属性

*属性是系统在所有有效执行中都应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

### Property 1: 壁画记录 JSON 往返一致性
*对于任意*有效的壁画记录对象，将其序列化为 JSON 字符串后再反序列化，应得到与原始对象等价的数据对象。
**Validates: Requirements 10.1, 10.2**

### Property 2: 标注数据文本格式往返一致性
*对于任意*有效的病害标注对象，将其格式化为可读文本后再解析回标注对象，应得到与原始对象等价的数据。
**Validates: Requirements 10.5, 10.6**

### Property 3: 标注坐标精度保持
*对于任意*病害标注的坐标数据，序列化为 JSON 后坐标值的精度应保持至小数点后四位。
**Validates: Requirements 10.3**

### Property 4: 无效 JSON 数据校验
*对于任意*不符合预定义 schema 的 JSON 数据，反序列化时应返回包含具体不合规字段信息的校验错误。
**Validates: Requirements 10.4**

### Property 5: 坐标边界裁剪
*对于任意*标注区域坐标，如果坐标值超出 [0, 1] 的相对坐标范围，裁剪后所有坐标值应在 [0, 1] 范围内，且裁剪操作是幂等的（裁剪两次等于裁剪一次）。
**Validates: Requirements 4.6**

### Property 6: 标注面积计算一致性
*对于任意*多边形标注区域，计算得到的面积应为正数且不超过 1（相对面积），面积百分比应等于面积乘以 100。
**Validates: Requirements 4.2**

### Property 7: 角色权限映射正确性
*对于任意*用户角色和 API 端点组合，系统的访问控制决策应与预定义的角色-权限映射表一致：研究员/助理修复师仅能访问查看和标注功能，管理员可访问用户管理和系统配置，审核员可审批修复方案。
**Validates: Requirements 1.4, 1.5, 1.6**

### Property 8: 认证令牌有效性
*对于任意*有效凭据，登录后返回的令牌应包含正确的用户角色信息；*对于任意*过期令牌，使用该令牌的请求应被拒绝。
**Validates: Requirements 1.1, 1.3**

### Property 9: 无效凭据拒绝
*对于任意*无效的用户名或密码组合，登录请求应被拒绝并返回错误提示。
**Validates: Requirements 1.2**

### Property 10: 密码重置链接一次性
*对于任意*密码重置链接，使用一次后再次使用应被拒绝。
**Validates: Requirements 1.7**

### Property 11: 壁画记录创建与校验
*对于任意*壁画数据，如果包含所有必填字段（名称、年代、出土地点、材质）则创建成功并返回唯一 ID；如果缺少任一必填字段则创建被拒绝并返回具体的字段校验错误。
**Validates: Requirements 3.1, 3.6**

### Property 12: 壁画筛选结果一致性
*对于任意*壁画筛选条件（名称、出土地点、年代、材质、状态），返回的所有壁画记录应全部满足该筛选条件。
**Validates: Requirements 3.3**

### Property 13: 壁画修改历史完整性
*对于任意*壁画记录的字段修改操作，修改后应能查到包含旧值和新值的历史记录。
**Validates: Requirements 3.5**

### Property 14: 图像上传 hash 一致性
*对于任意*上传的图像文件，存储后计算的 SHA-256 hash 值应与上传时计算的 hash 值一致。
**Validates: Requirements 3.2**

### Property 15: 标注版本快照完整性
*对于任意*病害标注的修改操作，修改后应存在包含修改前数据的版本快照，且快照的版本号应递增。
**Validates: Requirements 4.4**

### Property 16: 标注删除一致性
*对于任意*病害标注的删除操作，删除后该标注应不再出现在壁画的标注列表中。
**Validates: Requirements 4.5**

### Property 17: 多图层标注隔离
*对于任意*壁画的不同图层（可见光、红外、紫外），在某一图层上创建的标注应仅关联到该图层，查询其他图层时不应返回该标注。
**Validates: Requirements 4.7**

### Property 18: 项目创建初始化阶段
*对于任意*新创建的修复项目，应自动包含七个标准修复流程阶段（现状调查与评估、病害机理分析、清洗/去污、加固、补色/全色、封护、监测与验收），且阶段顺序正确。
**Validates: Requirements 5.1**

### Property 19: 项目进度计算正确性
*对于任意*项目的任务状态组合，项目整体进度百分比应等于已完成任务数除以总任务数乘以 100。
**Validates: Requirements 5.3**

### Property 20: 项目完成前置校验
*对于任意*存在未完成任务的项目，标记为已完成的操作应被拒绝，且响应中应列出所有未完成的任务。
**Validates: Requirements 5.6**

### Property 21: 材料费用汇总一致性
*对于任意*项目的材料消耗记录集合，项目的总费用应等于所有材料记录费用之和。
**Validates: Requirements 5.5**

### Property 22: 仪表盘汇总数据正确性
*对于任意*系统数据状态，仪表盘展示的待办任务数量应等于状态为待处理的任务总数，进行中项目数量应等于状态为修复中的项目总数，壁画总数应等于系统中所有壁画记录的数量。
**Validates: Requirements 2.1**

### Property 23: 健康指数预警正确性
*对于任意*壁画集合，健康指数低于预设阈值的壁画应全部出现在预警列表中，健康指数高于或等于阈值的壁画不应出现在预警列表中。
**Validates: Requirements 2.2**

### Property 24: 操作日志时间排序
*对于任意*操作日志查询结果，返回的记录应严格按创建时间倒序排列。
**Validates: Requirements 9.3**

### Property 25: 用户角色变更即时生效
*对于任意*用户角色变更操作，变更后该用户的权限应立即反映新角色的权限集合。
**Validates: Requirements 9.2**

### Property 26: 知识库分类筛选一致性
*对于任意*知识库分类筛选，返回的所有文档应全部属于该分类。
**Validates: Requirements 8.1**

### Property 27: 知识库搜索结果相关性
*对于任意*搜索关键词，返回的所有文档的标题或内容应包含该关键词。
**Validates: Requirements 8.2**

### Property 28: AI 检测结果转标注一致性
*对于任意* AI 检测结果，确认后转换生成的病害标注记录应包含检测结果中的病害类型、区域坐标和置信度信息。
**Validates: Requirements 7.3**

### Property 29: 修复报告内容完整性
*对于任意*壁画及其关联的病害标注数据，生成的修复报告应包含壁画基本信息、所有病害的统计数据和修复建议。
**Validates: Requirements 7.4**

## 测试策略

### 双重测试方法

系统采用单元测试和属性测试相结合的方式确保正确性：

- **单元测试**：验证具体示例、边界情况和错误条件，使用 Go 标准 `testing` 包（后端）和 Vitest（前端）
- **属性测试**：验证应在所有输入上成立的通用属性，使用 `gopter`（Go 属性测试库）和 `fast-check`（TypeScript 属性测试库）

### 属性测试库

- **后端（Go）**：使用 `github.com/leanovate/gopter` 库进行属性测试
- **前端（TypeScript）**：使用 `fast-check` 库进行属性测试
- 每个属性测试配置最少运行 100 次迭代
- 每个属性测试必须用注释标注对应的正确性属性编号和需求编号

### 测试标注格式

每个属性测试必须包含以下格式的注释：
```
// Feature: northern-qi-mural-restoration, Property {number}: {property_text}
// Validates: Requirements X.Y
```

### 测试分布

**后端属性测试（gopter）**：
- Property 1-4: 序列化/反序列化往返一致性、坐标精度、schema 校验
- Property 5-6: 坐标裁剪、面积计算
- Property 7-10: 认证与权限
- Property 11-14: 壁画记录 CRUD 与校验
- Property 15-17: 标注版本管理
- Property 18-21: 项目管理业务规则
- Property 22-25: 仪表盘、日志、角色变更
- Property 26-27: 知识库筛选与搜索
- Property 28-29: AI 检测转换、报告生成

**前端属性测试（fast-check）**：
- Property 1-4: 前端序列化工具函数的往返一致性
- Property 5-6: 前端坐标裁剪和面积计算工具函数

### 单元测试覆盖

- 各 API 端点的基本请求/响应验证
- 边界情况（空输入、极大值、特殊字符）
- 错误处理路径（404、403、500 等）
- UI 组件渲染测试（官网首页各区域、仪表盘图表）
