# 项目运行手册

本手册用于本地启动 `beiqi-mural-guardian`，内容已与当前仓库实现对齐（端口、命令、代理、问答配置）。

## 1. 前置环境

- Docker Desktop（需保持运行）
- Go 1.25+
- Node.js 20+
- npm
- make

可选检查：

```bash
git --version
docker --version
go version
node -v
npm -v
make -v
```

## 2. 获取代码

```bash
git clone <你的仓库地址>
cd beiqi-mural-guardian
```

## 3. 启动数据库（PostgreSQL）

```bash
docker compose up -d
docker compose ps
```

预期看到 `beiqi-postgres` 运行，端口 `5432` 暴露。

## 4. 启动后端（8080）

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

预期返回：

```json
{"status":"ok"}
```

### 4.1 如果 `make dev` 提示未检测到 air

1. 重新安装：

```bash
cd backend
make install-air
```

2. 检查 air 可执行文件：

```bash
ls "$(go env GOPATH)/bin/air"
```

3. 若存在但仍找不到，补 PATH（zsh 示例）：

```bash
echo 'export PATH="$(go env GOPATH)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

说明：本项目 `backend/Makefile` 已支持从 `$(go env GOPATH)/bin/air` 回退执行。

## 5. 启动前端（5173）

```bash
cd frontend
npm install
npm run dev
```

前端地址：`http://localhost:5173`

开发代理（`vite.config.ts`）：

- `/api` -> `http://localhost:8080`
- `/uploads` -> `http://localhost:8080`

## 6. 可选：导入演示数据

如果需要快速看到样例壁画、项目、知识库文档：

```bash
cd backend
PGPASSWORD=beiqi123 psql -h localhost -p 5432 -U beiqi -d beiqi_mural -f scripts/seed_demo_data.sql
```

> 注意：脚本中的部分数据依赖已有用户（例如 `reviewer`）。

## 7. 可选：配置知识库问答 LLM（DeepSeek/OpenAI 兼容）

编辑 `backend/.env`：

```env
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=你的key
LLM_MODEL=deepseek-chat
```

不配置时，知识库问答会自动降级为检索摘要。

## 8. 验证页面与功能

- 登录页：`http://localhost:5173/login`
- 知识库文档：`/knowledge`
- 智能问答：`/knowledge/chat`

问答接口：

- 普通：`POST /api/knowledge/qa`
- 流式：`POST /api/knowledge/qa/stream`

## 9. 停止服务

- 停止前后端：各自终端 `Ctrl + C`
- 停止数据库：

```bash
docker compose down
```

- 若要清空数据库卷：

```bash
docker compose down -v
```

## 10. 常见问题排查

1. 端口冲突（`5432/8080/5173`）
- 修改 `docker-compose.yml` 或后端 `SERVER_PORT` / 前端 `vite.config.ts`。

2. 后端连不上数据库
- 检查 `backend/.env`：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`。

3. 前端请求失败
- 先确认 `http://localhost:8080/health` 正常，再检查浏览器 Network 的 `/api` 请求。

4. 图片 404
- 检查图片 URL 是否为 `/uploads/...`。
- 检查 `UPLOAD_DIR` 实际路径，建议改为绝对路径。

5. 问答始终降级
- 检查 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL` 是否配置正确。
