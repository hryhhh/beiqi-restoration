# 北齐壁蕴 / Northern Qi Mural Guardian

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
[![License](https://img.shields.io/github/license/hryhhh/beiqi-restoration?style=for-the-badge)](./LICENSE)
[![Issues](https://img.shields.io/github/issues/hryhhh/beiqi-restoration?style=for-the-badge)](https://github.com/hryhhh/beiqi-restoration/issues)
[![Runbook](https://img.shields.io/badge/Runbook-Local_Setup-0A66C2?style=for-the-badge&logo=readthedocs&logoColor=white)](./docs/run.md)
[![Windows Setup](https://img.shields.io/badge/Windows-WSL_Setup-0078D4?style=for-the-badge&logo=windows&logoColor=white)](./WINDOWS_SETUP.md)

一套面向北齐壁画数字化保护、病害标注、修复流程协同与知识问答的全栈平台。

![项目视觉预览](./frontend/src/assets/images/show.jpg)

## 项目简介 / Introduction

北齐壁画守护者聚焦文物修复场景中的数字化建档、病害标注、项目推进、方案审核、知识检索与管理审计，目标是把原本分散在纸质档案、图片目录和线下协作中的流程，整合为一套可追踪、可查询、可协作的平台。

当前仓库已经落地了前端展示层、Go 后端 API、PostgreSQL 数据持久化、本地开发数据库容器、知识库问答接口和管理端能力。系统适合文保团队、研究人员、修复项目负责人和演示型数字文保项目做本地开发、功能扩展或二次集成。如果这个项目对你有帮助，欢迎点一个 Star。

在线 Demo 目前未公开发布，推荐按照下方步骤本地体验；更多运行细节见 [docs/run.md](./docs/run.md)。

## 技术栈 / Tech Stack

### 前端

- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 6
- Tailwind CSS 4
- React Router 7
- Zustand 5
- ECharts、Fabric.js、OpenSeadragon、Three.js

### 后端

- Go 1.25
- Gin
- GORM
- PostgreSQL 16
- JWT 认证
- SSE 流式响应

### 其他

- Docker Compose
- Air 热重载
- ESLint
- Go Test

## 项目结构 / Project Structure

```text
beiqi-mural-guardian/
├── frontend/              # React + Vite 前端应用
├── backend/               # Go + Gin 后端服务
├── docs/                  # 运行手册与交接文档
├── uploads/               # 示例素材与上传资源目录
├── docker-compose.yml     # 本地 PostgreSQL 容器
├── Makefile               # 根目录常用命令封装
├── WINDOWS_SETUP.md       # Windows + WSL 启动说明
└── README.md              # 项目总览
```

主要子文档：

- [frontend/README.md](./frontend/README.md)：前端页面、代理、构建说明
- [backend/README.md](./backend/README.md)：后端启动、环境变量、接口分组说明
- [docs/run.md](./docs/run.md)：完整本地运行手册
- [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)：Windows + WSL 首次安装流程

## 快速开始 / Quick Start

以下命令默认以 macOS / Linux / WSL 的 Bash 为例；如果你在 Windows PowerShell 环境开发，优先参考 [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)。

### 1. 前提条件

- Docker Desktop
- Go 1.25+
- Node.js 20+
- npm 10+
- GNU Make

### 2. 克隆仓库

```bash
git clone https://github.com/hryhhh/beiqi-restoration.git beiqi-mural-guardian
cd beiqi-mural-guardian
```

### 3. 启动数据库

```bash
docker compose up -d
docker compose ps
```

默认会启动一个 PostgreSQL 16 容器：

- Host: `localhost`
- Port: `5432`
- DB: `beiqi_mural`
- User: `beiqi`

### 4. 配置后端环境变量

```bash
cp backend/.env.example backend/.env
```

关键配置项包括：

- 数据库：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- 鉴权：`JWT_SECRET`、`JWT_EXPIRE_HOURS`
- 文件：`UPLOAD_DIR`、`MAX_UPLOAD_SIZE`
- 问答：`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`

### 5. 启动后端

```bash
cd backend
make install-air #仅首次运行时需要
make dev
```

默认访问地址：

- API: `http://localhost:8080`
- Health Check: `http://localhost:8080/health`

### 6. 启动前端

```bash
cd frontend
npm install #仅首次运行时需要
npm run dev
```

默认访问地址：

- Frontend: `http://localhost:5173`

开发环境中，Vite 会自动代理：

- `/api` -> `http://localhost:8080`
- `/uploads` -> `http://localhost:8080`

### 7. 导入演示数据

```bash
cd backend
PGPASSWORD=beiqi123 psql -h localhost -p 5432 -U beiqi -d beiqi_mural -f scripts/seed_demo_data.sql
```

如果需要快速创建多角色开发账号，推荐直接查看 [docs/run.md](./docs/run.md) 中的初始化 SQL。

## 功能特性 / Features

- ✅ 壁画档案管理：支持壁画列表、详情、历史记录、图片上传与多资源管理
- ✅ 病害标注：支持多边形 / 矩形标注、版本快照与分层标注
- ✅ 修复项目协同：覆盖项目、阶段、任务、分配、附件与材料记录
- ✅ 修复方案管理：支持方案创建、状态流转、内容编辑与审核
- ✅ 仪表盘：提供摘要、预警和图表统计接口
- ✅ 知识库：支持文档分类管理、搜索、普通问答与 SSE 流式问答
- ✅ 管理后台：支持用户角色、日志、数据库备份与 CSV 导出
- ✅ 图像分析工作台：前端已具备上传、检测、生成报告、转标注的流程


## 测试 / Testing

后端测试：

```bash
cd backend
make test
```

前端检查：

```bash
cd frontend
npm run lint
npm run build
```

说明：

- 前端没有单独的 `npm test` 脚本
- `npm run build` 已包含 TypeScript 构建检查

## 贡献指南 / Contributing

欢迎通过 Issue 和 PR 参与改进。提交前建议遵循以下约定：

1. 先创建 Issue 或在已有 Issue 下同步需求 / 问题背景
2. 从 `main` 拉出功能分支，例如 `feat/knowledge-streaming`
3. 提交前至少运行后端测试与前端构建检查
4. Commit 信息建议采用 Conventional Commits，例如 `feat: add mural asset management`
5. PR 中写清变更范围、验证方式和可能影响的模块

## 常见问题 / Troubleshooting

### `make dev` 提示找不到 `air`

```bash
cd backend
make install-air
```

如果安装后仍不可用，检查 `$(go env GOPATH)/bin` 或 `GOBIN` 是否在 `PATH` 中。

### 前端访问正常，但接口全部失败

优先检查：

- `http://localhost:8080/health` 是否可访问
- 浏览器 Network 中 `/api` 请求是否被代理到 8080
- `backend/.env` 中数据库配置是否正确

### 图片返回 404

优先检查：

- 图片 URL 是否以 `/uploads/...` 开头
- `UPLOAD_DIR` 是否和实际存储路径一致
- 后端是否以与文件生成时相同的工作目录启动

建议在 `.env` 中把 `UPLOAD_DIR` 改为绝对路径。

### 知识库问答始终降级为搜索摘要

优先检查：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

如果未配置这些变量，系统会自动回退为检索摘要模式。

### 图像分析页总是显示模拟结果

这是当前实现的已知行为。前端分析页有 mock 兜底，但后端 `detect` 尚未注入真实 AI 检测器。

## 许可证 / License

本项目采用 [MIT License](./LICENSE)。

## 联系方式 / Resources

- 仓库地址：https://github.com/hryhhh/beiqi-restoration
- Issue 反馈：https://github.com/hryhhh/beiqi-restoration/issues
- 运行手册：[docs/run.md](./docs/run.md)
- Windows 指南：[WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
- 前端文档：[frontend/README.md](./frontend/README.md)
- 后端文档：[backend/README.md](./backend/README.md)
