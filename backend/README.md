# ⚙️ Backend - 北齐壁画守护者后端

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-1.12-009688?style=for-the-badge&logo=gin&logoColor=white)
![GORM](https://img.shields.io/badge/GORM-ORM-2C3E50?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-111827?style=for-the-badge)
[![Root README](https://img.shields.io/badge/Docs-Project_README-0A66C2?style=for-the-badge&logo=readthedocs&logoColor=white)](../README.md)

负责认证、壁画档案、病害标注、修复项目、知识库问答、管理后台与文件服务等业务 API。

## 项目简介 / About

后端基于 Go + Gin + GORM 构建，默认连接 PostgreSQL，并在启动时通过 `AutoMigrate` 自动迁移核心表结构。系统同时提供 JWT 鉴权、RBAC 角色控制、上传文件静态服务、知识库问答接口、管理端备份导出等能力。

当前后端已经能够支撑前端页面的主要业务流。需要注意的是，图像分析中的真实 AI 检测器尚未接入，`/api/analysis/detect` 仍处于占位降级状态。

## 技术栈 / Tech Stack

- Go 1.25
- Gin
- GORM
- PostgreSQL
- JWT
- Zap Logger
- Godotenv
- Air

## 项目结构 / Project Structure

```text
backend/
├── cmd/server/            # 服务启动入口
├── internal/
│   ├── config/            # 配置加载
│   ├── database/          # 数据库初始化与迁移
│   ├── handler/           # HTTP Handler
│   ├── middleware/        # JWT / CORS / 审计等中间件
│   ├── model/             # GORM 模型
│   ├── repository/        # 数据访问层
│   ├── serializer/        # 输出序列化辅助
│   └── service/           # 业务服务层
├── pkg/
│   ├── hash/              # 密码散列
│   ├── jwt/               # JWT 工具
│   ├── logger/            # 日志
│   ├── response/          # 通用响应封装
│   └── storage/           # 本地文件存储
├── scripts/               # SQL 脚本
├── uploads/               # 本地上传目录
├── .env.example           # 环境变量模板
├── .air.toml              # Air 配置
├── Makefile               # 后端命令入口
└── README.md
```

## 快速开始 / Getting Started

### 前提条件

- Go 1.25+
- PostgreSQL 16+
- GNU Make
- 可选：`air` 热重载工具

本仓库根目录已经提供数据库容器，推荐先在项目根目录执行：

```bash
docker compose up -d
```

### 环境变量

```bash
cp .env.example .env
```

常用变量说明：

| 变量 | 说明 |
| --- | --- |
| `SERVER_PORT` | 服务端口，默认 `8080` |
| `SERVER_MODE` | Gin 运行模式，默认 `debug` |
| `DB_HOST` / `DB_PORT` | PostgreSQL 地址 |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 数据库凭证 |
| `JWT_SECRET` | JWT 密钥，生产环境必须修改 |
| `JWT_EXPIRE_HOURS` | Token 有效期 |
| `UPLOAD_DIR` | 文件上传目录，建议生产环境使用绝对路径 |
| `MAX_UPLOAD_SIZE` | 单文件最大上传限制 |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | 知识库问答所需大模型配置 |

如果不配置 `LLM_*` 变量，知识库问答会自动降级为检索摘要模式。

### 启动开发服务

```bash
make install-air
make dev
```

或直接运行：

```bash
make run
```

默认地址：

- API: `http://localhost:8080`
- Health: `http://localhost:8080/health`
- Uploads: `http://localhost:8080/uploads/...`

### 可选：导入演示数据

```bash
PGPASSWORD=beiqi123 psql -h localhost -p 5432 -U beiqi -d beiqi_mural -f scripts/seed_demo_data.sql
```

## 功能特性 / Features

- ✅ JWT 登录、注册、密码重置、当前用户信息
- ✅ 基于角色的权限控制：管理员、首席修复师、助理、研究员、审核员
- ✅ 壁画档案、图片上传、3D / 全景资源管理与历史记录
- ✅ 病害标注 CRUD、版本快照与图层维度管理
- ✅ 修复项目、阶段、任务、附件、材料记录
- ✅ 修复方案创建、内容更新、状态流转与审核
- ✅ 仪表盘摘要、预警、图表统计
- ✅ 知识库文档管理、搜索、普通问答与 SSE 流式问答
- ✅ 管理后台用户管理、日志查询、数据库备份、CSV 导出
- ⚠️ 图像分析的真实 AI 检测器暂未接入，`detect` 接口默认不可用

## API 分组 / API Groups

路由注册位于 `cmd/server/main.go`，核心前缀如下：

| 前缀 | 说明 |
| --- | --- |
| `/health` | 健康检查 |
| `/api/public` | 官网公开数据 |
| `/api/auth` | 登录、注册、重置密码、当前用户 |
| `/api/murals` | 壁画档案、图片与资源管理 |
| `/api/murals/:id/annotations` | 病害标注与版本 |
| `/api/projects` | 修复项目、任务、材料 |
| `/api/plans` | 修复方案与审核 |
| `/api/dashboard` | 摘要、预警、图表 |
| `/api/analysis` | 检测、确认、报告 |
| `/api/knowledge` | 文档、搜索、问答 |
| `/api/admin` | 用户、日志、备份、导出 |

知识库问答：

- `POST /api/knowledge/qa`
- `POST /api/knowledge/qa/stream`

SSE 事件：

- `start`
- `token`
- `error`
- `done`

## 部署 / Deployment

### 构建

```bash
make build
```

产物默认输出到 `bin/server`。

### 生产部署建议

- 使用独立 PostgreSQL 实例，不沿用本地开发账号
- 把 `UPLOAD_DIR`、日志目录、备份目录配置到持久化磁盘
- 将 `JWT_SECRET` 替换为强随机密钥
- 使用反向代理统一暴露 HTTPS
- 如果启用 `POST /api/admin/backup`，确保宿主机安装 `pg_dump`

## 测试 / Testing

```bash
make test
```

其他常用命令：

```bash
make tidy
make clean
```

## 常见问题 / Troubleshooting

### `make dev` 提示未检测到 `air`

```bash
make install-air
```

如果仍失败，检查 `$(go env GOPATH)/bin/air` 是否存在，以及该目录是否已加入 `PATH`。

### 后端连不上数据库

优先检查：

- 根目录 `docker compose ps` 中 PostgreSQL 是否运行
- `.env` 里的 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- 本机 `5432` 端口是否被其他数据库占用

### 图片或上传资源 404

优先检查：

- `UPLOAD_DIR` 是否写到预期目录
- 服务启动目录是否发生变化
- 前端是否通过 `/uploads/...` 访问资源

生产环境建议始终使用绝对路径。

### 知识库问答没有调用大模型

这是降级策略生效的表现。请检查：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

### 图像分析接口返回不可用

当前 `cmd/server/main.go` 中未注入真实 AI 检测器，`/api/analysis/detect` 默认不会返回真实识别结果。这不是数据库或网络故障，而是当前版本的既定实现状态。

## 贡献指南 / Contributing

后端改动建议：

1. 保持 `handler -> service -> repository` 的职责边界
2. 为新增接口同步补充权限校验与错误响应
3. 涉及模型字段变更时，确认 `AutoMigrate` 影响范围
4. 提交前至少运行 `make test`

## 许可证 / License

本目录遵循项目根目录的 [MIT License](../LICENSE)。

## 更多资源 / Resources

- 项目总览：[../README.md](../README.md)
- 前端文档：[../frontend/README.md](../frontend/README.md)
- 运行手册：[../docs/run.md](../docs/run.md)
- Windows + WSL 指南：[../WINDOWS_SETUP.md](../WINDOWS_SETUP.md)
