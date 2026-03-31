# 北齐壁蕴系统接手文档

> 更新时间：2026-03-31

## 1. 项目快照

- 项目名：Northern Qi Mural Guardian（北齐壁蕴系统）
- 目标：壁画修复全流程数字化（档案、标注、项目、方案、知识、审计）
- 仓库结构：
  - `frontend/`：React + TypeScript + Vite
  - `backend/`：Go + Gin + GORM
  - `docker-compose.yml`：本地 PostgreSQL

## 2. 技术栈与关键版本

### 前端
- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 6
- Zustand 5

### 后端
- Go 1.25
- Gin 1.12
- GORM 1.31
- PostgreSQL Driver
- JWT (`github.com/golang-jwt/jwt/v5`)

## 3. 本地启动（当前推荐流程）

1. 启动数据库

```bash
docker compose up -d
```

2. 启动后端（默认 `8080`）

```bash
cd backend
cp .env.example .env
make install-air
make dev
```

3. 启动前端（默认 `5173`）

```bash
cd frontend
npm install
npm run dev
```

4. 健康检查

```bash
curl http://localhost:8080/health
```

5. 开发代理
- `/api` -> `http://localhost:8080`
- `/uploads` -> `http://localhost:8080`

## 4. 模块状态（按当前代码）

### 4.1 认证与权限
- 认证接口：登录、注册、重置密码、获取当前用户
- 路由守卫：`ProtectedRoute` 基于 `token + initialized` 控制，角色路由会要求 `user` 存在
- 密码重置确认接口已兼容两种字段：`newPassword`（新）与 `password`（兼容旧）

### 4.2 壁画/标注/项目/方案
- 壁画：列表、详情、创建、更新、图片上传、历史
- 标注：增删改查 + 版本快照
- 项目：项目、阶段、任务、分配、附件、材料
- 方案：创建、状态更新、审核

### 4.3 仪表盘
- `summary` / `alerts` / `charts` 可用

### 4.4 图像分析
- `POST /api/analysis/detect`：当前默认不可用（`main.go` 里 detector 传 `nil`，会返回 503）
- `POST /api/analysis/confirm`：可用，可把检测结果转为标注
- `POST /api/analysis/report`：可用，可按当前标注生成报告

### 4.5 知识库与智能问答
- 文档：分类管理 + 搜索 + 文档详情
- 问答接口：
  - 普通：`POST /api/knowledge/qa`
  - 流式：`POST /api/knowledge/qa/stream`（SSE）
- 现有能力：
  - 检索增强（适配中文问句）
  - LLM 不可用自动降级检索摘要
  - 引用序号标准化（修复越界或缺失引用）
  - 简单寒暄（hi/hello/你好/谢谢/再见）：优先走 LLM，失败回退本地回复
- SSE 事件：`start` / `token` / `error` / `done`
- 前端问答页已支持：
  - 流式渲染
  - 停止生成（AbortController）
  - 引用点击查看文档与命中段落定位

### 4.6 管理后台
- `GET /api/admin/users`、`PUT /api/admin/users/:id/role`
- `GET /api/admin/logs`
- `POST /api/admin/backup`：调用 `pg_dump` 生成 SQL 备份（依赖本机安装 `pg_dump`）
- `POST /api/admin/export`：导出壁画 CSV

## 5. 数据模型关系（核心）

- `Mural` 1-N `MuralImage`
- `Mural` 1-N `DamageAnnotation`
- `DamageAnnotation` 1-N `AnnotationSnapshot`
- `Project` N-N `Mural`（`project_murals`）
- `Project` 1-N `ProjectPhase` 1-N `RestTask`
- `RestTask` N-N `User`（任务分配）
- `Project` 1-N `MaterialRecord`
- `RestorationPlan` 1-N `PlanReview`、1-N `PlanStatusChange`
- `AuditLog` N-1 `User`
- `KnowledgeDoc` 独立文档实体

## 6. 种子数据与素材

- SQL：`backend/scripts/seed_demo_data.sql`
- 上传素材：`uploads/murals/...`（仓库根）
- 后端 `UPLOAD_DIR` 默认 `./uploads`，建议在 `.env` 中改绝对路径，避免不同启动目录导致 404

## 7. 当前验证记录

最近一次本地验证（2026-03-31）：

```bash
cd backend && GOCACHE=/tmp/go-build go test ./...
cd frontend && npm run build
```

结果：通过。

## 8. 已知风险与注意事项

1. AI 检测器未接入生产实现
- 现状：`detect` 默认 503
- 影响：分析页会使用前端 mock 检测结果展示，不能真实落标注链路

2. 管理后台备份依赖环境命令
- 现状：`admin/backup` 依赖 `pg_dump`
- 影响：若部署环境未安装客户端工具，备份接口会失败

3. 前端缺少系统化自动化测试
- 现状：有构建与 lint，但缺少前端单测/集成测试
- 影响：交互回归主要靠手测

4. 仓库处于长期并行开发状态
- 现状：工作区常有多文件同时修改
- 建议：合并前先按功能拆分提交，避免大批量混改

## 9. 接手建议优先级

### P0（立即）
1. 接入真实 AI 检测服务（实现 `AIDetector` 并在 `main.go` 注入）
2. 给知识库问答补接口级回归测试（普通 + 流式 + 停止）
3. 将 `UPLOAD_DIR` 与备份目录统一为绝对路径配置

### P1（短期）
1. 为前端 API 层补单元测试（重点：SSE 多行解析与 abort）
2. 统一后端错误码与前端错误文案映射
3. 增加管理员导出/备份操作审计字段

### P2（中期）
1. 引入端到端测试（登录、问答、标注、项目流）
2. 提升知识库问答召回质量（重排、分段召回、缓存）
3. 完善监控（慢查询、接口耗时、错误告警）

## 10. 常用命令

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
make install-air
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
