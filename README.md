# 🏛️ 北齐壁蕴系统 / Northern Qi Mural Guardian

<p align="center">
  <strong>以数字技术，传承晋阳文化瑰宝</strong>
</p>

<p align="center">
  面向太原北齐壁画博物馆的数字化修复管理平台，支持壁画档案管理、病害精准标注、修复项目全流程跟踪、AI 辅助损伤检测与修复前后对比。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Go-1.25-00ADD8?logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Gin-1.12-00ADD8" alt="Gin" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ 功能概览

| 模块 | 功能 |
|------|------|
| 🖼️ **壁画库管理** | 壁画数字档案 CRUD、高清图像上传（SHA-256 校验）、多光谱图层、列表/卡片视图、批量导入 |
| 🔍 **病害精准标注** | 多边形/矩形/自由路径标注工具（Fabric.js）、10 种北齐壁画常见病害分类、面积自动计算、版本快照 |
| 📋 **修复项目管理** | 七阶段标准修复流程（评估→清洗→加固→补色→封护→验收）、看板视图、任务分配、材料消耗与预算 |
| 🔄 **修复前后对比** | 并排对比 + 滑块叠加模式、同步缩放平移、修复版本管理 |
| 🤖 **AI 图像分析** | AI 损伤检测（接口预留）、检测结果一键转标注、修复报告生成 |
| 📚 **知识库** | 标准流程、材料手册、案例库、法规文件分类管理与全文搜索 |
| 🛡️ **管理后台** | 五级角色权限（管理员/首席修复师/助理修复师/研究员/审核员）、操作审计日志、数据备份与导出 |
| 🏠 **官网首页** | 故宫宫廷风设计、视差滚动、AI 修复粒子动画、数字计数动画、响应式布局 |

## 🏗️ 技术栈

### 前端 (`frontend/`)

- **框架**：React 19 + TypeScript 5.9 + Vite 8
- **状态管理**：Zustand 5
- **UI 组件**：Ant Design 6 + Tailwind CSS 4
- **图像标注**：Fabric.js 7
- **图表**：ECharts 6
- **路由**：React Router 7

### 后端 (`backend/`)

- **框架**：Go 1.25 + Gin 1.12
- **ORM**：GORM 1.31 + PostgreSQL
- **认证**：JWT（golang-jwt/jwt/v5）+ bcrypt
- **日志**：Zap
- **校验**：validator.v10

### 基础设施

- **数据库**：PostgreSQL 16（Docker）
- **文件存储**：本地文件系统（可扩展至 OSS/S3）

## 📁 项目结构

```
beiqi-mural-guardian/
├── frontend/                     # React 前端项目
│   ├── src/
│   │   ├── api/                  # API 请求封装
│   │   ├── components/           # 通用组件（标注工具、对比视图、布局）
│   │   ├── features/             # 按业务领域组织的功能模块
│   │   ├── hooks/                # 自定义 Hooks
│   │   ├── pages/                # 路由页面
│   │   ├── stores/               # Zustand 状态管理
│   │   ├── types/                # TypeScript 类型定义
│   │   ├── utils/                # 工具函数（序列化、坐标计算、校验）
│   │   └── constants/            # 常量（病害类型、修复阶段、角色枚举）
│   └── public/
├── backend/                      # Go 后端项目
│   ├── cmd/server/               # 入口
│   ├── internal/
│   │   ├── handler/              # HTTP 处理器
│   │   ├── service/              # 业务逻辑层
│   │   ├── repository/           # 数据访问层
│   │   ├── model/                # GORM 数据模型
│   │   ├── domain/               # 纯业务领域模型
│   │   ├── middleware/            # JWT、RBAC、审计日志
│   │   ├── serializer/           # JSON 序列化 + 文本格式化
│   │   └── dto/                  # 请求/响应 DTO
│   ├── pkg/                      # 可复用包（JWT、哈希、图像处理、日志）
│   └── migrations/               # 数据库迁移
├── docs/                         # 项目文档
├── docker-compose.yml            # 开发环境
├── Makefile                      # 根级命令
└── README.md
```

## 🚀 快速开始

### 前置要求

- Docker Desktop（已启动）
- Go 1.25+
- Node.js 20+
- make

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/beiqi-mural-guardian.git
cd beiqi-mural-guardian
```

### 2. 启动数据库

```bash
docker compose up -d
```

### 3. 启动后端

```bash
cd backend
cp .env.example .env
make run
```

后端默认监听 `http://localhost:8080`，健康检查：`GET /health`

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认地址 `http://localhost:5173`，已通过 Vite Proxy 将 `/api` 代理到后端。

### 5. 访问系统

浏览器打开 `http://localhost:5173`，注册账号后登录即可使用。

## 🔐 角色与权限

| 角色 | 说明 | 核心权限 |
|------|------|----------|
| `admin` | 管理员 | 用户管理、系统配置、数据备份导出 |
| `chief_restorer` | 首席修复师 | 壁画创建/编辑、项目管理 |
| `assistant` | 助理修复师 | 病害标注、任务执行 |
| `researcher` | 研究员 | 查看、标注 |
| `reviewer` | 审核员 | 修复方案审批 |

## 📊 数据模型

```
Mural ──1:N──> MuralImage
      ──1:N──> DamageAnnotation ──1:N──> AnnotationSnapshot
      ──1:N──> MuralHistory
      ──N:N──> Project (project_murals)

Project ──1:N──> ProjectPhase ──1:N──> RestTask ──N:N──> User (task_assignments)
                                                ──1:N──> TaskAttachment
        ──1:N──> MaterialRecord

DamageAnnotation ──1:N──> RestorationPlan ──1:N──> PlanReview
                                          ──1:N──> PlanStatusChange

AuditLog ──N:1──> User
KnowledgeDoc (独立实体)
```

## 🛠️ 常用命令

```bash
# 根目录
make dev-fe          # 启动前端开发服务器
make dev-be          # 启动后端开发服务器
make build-fe        # 构建前端
make build-be        # 构建后端

# 后端
cd backend
make run             # 运行
make test            # 测试
make tidy            # 整理依赖

# 前端
cd frontend
npm run dev          # 开发
npm run build        # 构建
npm run lint         # 代码检查
```

## 📐 设计规范

系统遵循《古代壁画保护修复档案规范》（GB/T 30235），确保数据安全和操作可追溯。

### 配色方案（故宫宫廷风）

| 用途 | 色值 | 说明 |
|------|------|------|
| 主背景 | `#F8F4ED` | 温暖米白 |
| 强调色 | `#9C2F2F` | 宫廷赭红 |
| 金色 | `#C9A66B` | 皇家暖金 |
| 卡片背景 | `#FAF6F0` | 浅米白 |
| 正文 | `#3F2E1E` | 深米灰 |

### 病害分类体系

- **结构类**：空鼓、起甲、酥碱、龟裂/裂缝
- **表面类**：颜料层脱落/粉化、褪色/变色、壁面污染
- **生物类**：霉斑/菌害、昆虫/动物危害、植物根系破坏

## 📝 API 文档

详见 `backend/docs/` 目录（Swagger/OpenAPI）。

核心接口概览：

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/auth` | 登录、注册、密码重置 |
| 壁画 | `/api/murals` | 壁画 CRUD、图像上传、修改历史 |
| 标注 | `/api/murals/:id/annotations` | 病害标注 CRUD、版本快照 |
| 项目 | `/api/projects` | 项目管理、任务、材料消耗 |
| 方案 | `/api/plans` | 修复方案、审批 |
| 分析 | `/api/analysis` | AI 检测、报告生成 |
| 知识库 | `/api/knowledge` | 文档管理与搜索 |
| 仪表盘 | `/api/dashboard` | 汇总统计、预警、图表 |
| 管理 | `/api/admin` | 用户管理、日志、备份 |
| 公开 | `/api/public` | 首页数据 |

## 🗺️ 路线图

- [x] 用户认证与五级角色权限
- [x] 壁画库 CRUD 与图像管理
- [x] 病害标注工具（多边形/矩形/自由路径）
- [x] 修复项目七阶段流程管理
- [x] 修复方案与审批流程
- [x] 仪表盘数据可视化
- [x] 知识库文档中心
- [x] 官网首页（故宫宫廷风 + 动画）
- [ ] AI 损伤检测服务集成
- [ ] 图像处理增强（缩略图、WebP、多光谱）
- [ ] 数据备份与导出真实实现
- [ ] 离线标注缓存与同步
- [ ] 批量导入（Excel + 图像文件夹）

## 📄 许可证

© 2026 太原北齐壁画博物馆

---

<p align="center">
  <sub>守护千年 · 传承未来</sub>
</p>
