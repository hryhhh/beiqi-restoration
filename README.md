# 北齐壁蕴 / Northern Qi Mural Guardian

面向北齐壁画数字化保护的全栈平台，覆盖壁画档案、病害标注、修复项目管理、知识库问答与后台运维能力。

## 功能概览

- 壁画档案管理：壁画信息 CRUD、图像上传、修改历史、批量导入
- 病害标注：多边形/矩形标注、版本快照、按壁画维度管理标注数据
- 项目管理：项目-阶段-任务全流程、任务分配、附件、材料记录、进度联动
- 修复方案：方案创建、状态流转、审核与状态变更记录
- 仪表盘：汇总统计、预警、图表数据接口
- 图像分析：检测/确认/报告接口（默认未接入外部 AI 检测器时会返回降级提示）
- 知识库：文档分类管理、搜索、普通问答、SSE 流式问答
- 管理后台：用户与角色管理、审计日志、数据库备份、CSV 导出

## 知识库问答（当前实现）

- 接口：
  - `POST /api/knowledge/qa`
  - `POST /api/knowledge/qa/stream`（SSE）
- 能力：
  - 基于知识库检索结果构建上下文，调用 OpenAI 兼容模型回答
  - 模型不可用时自动降级为“检索摘要”
  - 自动规范引用序号（如 `[1]`、`[2]`），避免无效引用
  - 支持简单寒暄（`hi`/`hello`/`你好`/`谢谢`/`再见`）
    - 若 LLM 可用：优先走 LLM 回复
    - 否则：回退本地简短回复
- SSE 事件：`start` / `token` / `error` / `done`

## 技术栈

- 前端：React 19、TypeScript 5.9、Vite 8、Ant Design 6、Zustand、Tailwind CSS 4
- 后端：Go 1.25、Gin、GORM、PostgreSQL、JWT、Zap
- 基础设施：Docker Compose（本地 PostgreSQL）

## 目录结构

```text
beiqi-mural-guardian/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
├── backend/                  # Go 后端
│   ├── cmd/server/           # 启动入口
│   ├── internal/             # handler/service/repository/model/middleware
│   ├── pkg/                  # 通用库
│   ├── scripts/              # SQL 脚本（含 seed_demo_data.sql）
│   └── .env.example
├── docs/
├── docker-compose.yml
└── README.md
```

## 快速开始

### 1. 前置环境

- Docker Desktop
- Go 1.25+
- Node.js 20+
- make

### 2. 启动数据库

```bash
docker compose up -d
```

### 3. 启动后端（8080）

```bash
cd backend
cp .env.example .env
make install-air   # 首次需要
make dev
```

后端默认地址：`http://localhost:8080`

健康检查：

```bash
curl http://localhost:8080/health
```

### 4. 启动前端（5173）

```bash
cd frontend
npm install
npm run dev
```

前端地址：`http://localhost:5173`

开发环境下 Vite 会将 `/api` 和 `/uploads` 代理到 `http://localhost:8080`。

## 环境变量（后端）

`backend/.env.example` 关键项：

- 服务与数据库：`SERVER_PORT`、`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- 鉴权：`JWT_SECRET`、`JWT_EXPIRE_HOURS`
- 文件：`UPLOAD_DIR`、`MAX_UPLOAD_SIZE`
- 问答模型：`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`

DeepSeek（OpenAI 兼容）示例：

```env
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=你的key
LLM_MODEL=deepseek-chat
```

## 常用命令

根目录：

```bash
make dev-fe
make dev-be
make build-fe
make build-be
```

后端：

```bash
cd backend
make dev
make run
make test
make tidy
```

前端：

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

## 数据与文件

- 后端通过 `AutoMigrate` 自动建表（启动时执行）
- 图片静态访问路径：`/uploads/*`
- 建议将 `UPLOAD_DIR` 配置为绝对路径，避免不同启动目录导致图片 404
- 可选：导入演示数据（数据库中需已有用户数据）

```bash
cd backend
PGPASSWORD=beiqi123 psql -h localhost -p 5432 -U beiqi -d beiqi_mural -f scripts/seed_demo_data.sql
```

## 主要接口前缀

- 认证：`/api/auth`
- 壁画：`/api/murals`
- 标注：`/api/murals/:id/annotations`
- 项目：`/api/projects`
- 方案：`/api/plans`
- 分析：`/api/analysis`
- 知识库：`/api/knowledge`
- 仪表盘：`/api/dashboard`
- 管理后台：`/api/admin`
- 公开页：`/api/public`

## 常见问题

- `make dev` 提示找不到 air：
  - 先执行 `make install-air`
  - 确认 `$(go env GOPATH)/bin`（或 `GOBIN`）在 `PATH` 中
- 问答只走降级摘要：
  - 检查 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`
- 图片 404：
  - 检查 `UPLOAD_DIR` 实际目录与 `/uploads/...` URL 是否一致

## License

MIT
