# 北齐壁蕴系统接手文档

## 1. 项目概览
- 项目名称：Northern Qi Mural Guardian（北齐壁蕴系统）
- 目标用户：文物保护工作者、研究人员、管理人员
- 核心目标：将壁画修复流程（档案、标注、项目、方案、知识与审计）数字化并可追溯

仓库结构：
- `frontend/`：React + TypeScript + Vite 前端
- `backend/`：Go + Gin + GORM 后端
- `docker-compose.yml`：本地 PostgreSQL 开发库

## 2. 技术栈与版本
### 前端
- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 6
- Zustand 5
- Axios

参考：`frontend/package.json`

### 后端
- Go 1.25
- Gin 1.12
- GORM 1.31
- PostgreSQL Driver
- JWT（`github.com/golang-jwt/jwt/v5`）

参考：`backend/go.mod`

## 3. 本地启动（推荐）
1. 启动数据库
```bash
docker compose up -d
```
2. 启动后端
```bash
cd backend
cp .env.example .env
make dev
```
3. 启动前端
```bash
cd frontend
npm install
npm run dev
```

默认地址：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`
- 健康检查：`GET /health`

说明：前端开发环境已通过 Vite Proxy 将 `/api` 代理到 `http://localhost:8080`。

## 4. 后端模块地图
后端入口：`backend/cmd/server/main.go`

### 公共与认证
- `GET /api/public/landing`：首页公开数据
- `POST /api/auth/login`：登录
- `POST /api/auth/register`：注册
- `POST /api/auth/reset-password`：发起重置（开发态会返回 token）
- `POST /api/auth/reset-password/confirm`：确认重置

### 壁画模块（`/api/murals`）
- `GET /`：列表（分页+筛选）
- `GET /:id`：详情
- `GET /:id/history`：修改历史
- `POST /`、`PUT /:id`：创建/更新（管理员、首席修复师）
- `POST /:id/images`：上传图像

### 标注模块（`/api/murals/:id/annotations`）
- `GET /`：列表
- `POST /`：创建
- `PUT /:annotationId`：更新
- `DELETE /:annotationId`：删除
- `GET /:annotationId/versions`：版本快照

### 项目模块（`/api/projects`）
- `GET /`、`GET /:id`：列表/详情
- `POST /`：创建项目（自动初始化 7 个标准阶段）
- `PUT /:id/complete`：标记完成（要求所有任务完成）
- `POST /:id/tasks`：创建任务
- `PUT /:id/tasks/:taskId`：更新任务状态（会重算项目进度）
- `PUT /:id/tasks/:taskId/assign`：分配任务
- `POST /:id/tasks/:taskId/attachments`：上传任务附件
- `POST /:id/materials`：记录材料

### 修复方案模块（`/api/plans`）
- `GET /`、`GET /:id`：查询
- `POST /`：创建方案
- `PUT /:id`：更新状态
- `POST /:id/review`：审核（`reviewer` 角色）

### 仪表盘模块（`/api/dashboard`）
- `GET /summary`：汇总统计
- `GET /alerts`：健康指数预警
- `GET /charts`：图表数据

### 图像分析模块（`/api/analysis`）
- `POST /detect`
- `POST /confirm`
- `POST /report`

当前状态：占位接口，统一返回 503（服务暂不可用）。

### 管理后台模块（`/api/admin`，仅 admin）
- `GET /users`、`PUT /users/:id/role`
- `GET /logs`
- `POST /backup`、`POST /export`（当前为占位实现）

## 5. 角色与权限
角色枚举：
- `admin`
- `chief_restorer`
- `assistant`
- `researcher`
- `reviewer`

鉴权机制：
- JWT 中间件：`Authorization: Bearer <token>`
- RBAC 中间件：`RequireRoles(...)`

核心权限要点：
- 壁画创建/编辑：`admin`、`chief_restorer`
- 标注创建/改删：`admin`、`chief_restorer`、`assistant`、`researcher`
- 方案审核：`reviewer`
- 管理后台：`admin`

## 6. 数据模型关系（核心）
### 壁画域
- `Mural` 1 - N `MuralImage`
- `Mural` 1 - N `DamageAnnotation`
- `Mural` 1 - N `MuralHistory`

### 标注域
- `DamageAnnotation` 1 - N `AnnotationSnapshot`

### 项目域
- `Project` N - N `Mural`（关联表：`project_murals`）
- `Project` 1 - N `ProjectPhase`
- `ProjectPhase` 1 - N `RestTask`
- `RestTask` N - N `User`（关联表：`task_assignments`）
- `RestTask` 1 - N `TaskAttachment`
- `Project` 1 - N `MaterialRecord`

### 方案域
- `RestorationPlan` 1 - N `PlanReview`
- `RestorationPlan` 1 - N `PlanStatusChange`
- `RestorationPlan` N - 1 `DamageAnnotation`（通过 `AnnotationID`）

### 审计与知识
- `AuditLog` N - 1 `User`
- `KnowledgeDoc` 独立文档实体

## 7. 前端页面与路由
路由定义：`frontend/src/router/index.tsx`

公开页：
- `/`：落地页
- `/login`：登录页

登录后页面：
- `/dashboard`
- `/murals`、`/murals/:id`
- `/projects`、`/projects/:id`
- `/plans`
- `/analysis`
- `/knowledge`

管理员页：
- `/admin`

## 8. 当前验证结果
已执行：
```bash
cd backend && go test ./... -v
```
结果：全部通过。

## 9. 已知问题与实现缺口
1. 图像分析接口为占位实现
- 现状：后端 `analysis` 全部返回 503；前端页面已做“不可用”提示
- 影响：AI 检测链路不可用，仅可手动标注

2. 管理后台备份/导出为占位实现
- 现状：仅返回“已触发”消息，无真实执行逻辑
- 影响：运维与归档能力不完整

3. 前端重置密码参数名不一致
- 现状：前端 `confirmResetPassword` 发送 `{ token, password }`
- 后端要求：`{ token, newPassword }`
- 影响：确认重置接口会因参数校验失败而报错

4. 前端角色守卫在刷新场景存在潜在放行窗口
- 现状：`ProtectedRoute` 在 `token` 存在但 `user` 为空时，角色校验不会拦截
- 影响：可能出现短暂的路由层误放行（后端 RBAC 仍会兜底）

## 10. 接手后建议优先级
### P0（立即）
1. 修复前后端重置密码字段不一致问题（`password` -> `newPassword`）
2. 增加前端启动时用户信息恢复流程（`/me` 或 token 解码后拉取用户）并收紧角色守卫
3. 补充最小可用种子数据（管理员账号、示例壁画、示例项目）

### P1（短期）
1. 落地 `admin/backup` 与 `admin/export` 的真实实现
2. 对关键接口补充集成测试（auth、RBAC、project 完成校验）
3. 前后端统一错误码与错误文案映射

### P2（中期）
1. 接入真实 AI 服务（detect/confirm/report）
2. 图像处理链路增强（缩略图、WebP、元数据）
3. 观测性建设（审计日志检索、慢查询、告警）

## 11. 常用命令
根目录：
```bash
make dev-fe      # 启动前端
make dev-be      # 启动后端
make build-fe    # 构建前端
make build-be    # 构建后端
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
