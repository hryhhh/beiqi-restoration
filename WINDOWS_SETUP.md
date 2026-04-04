# Windows + WSL 安装环境与启动步骤

本文档用于在 **Windows + WSL2（Ubuntu）** 环境首次运行 `beiqi-mural-guardian`。  
以下命令默认在 **WSL bash** 中执行，不是 PowerShell。

## 1. 前置条件（Windows 侧）

- Windows 10/11（x64）
- 已安装 WSL2（推荐 Ubuntu 24.04 或 22.04）
- Docker Desktop（开启 WSL Integration）

可在 PowerShell 执行以下命令确认：

```powershell
wsl -l -v
docker version
docker compose version
```

## 2. 在 WSL 安装依赖

进入 WSL 终端后执行：

```bash
sudo apt update
sudo apt install -y git make curl build-essential
```

安装 Node.js（20+）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

安装 Go（1.25+，按项目要求）：

```bash
sudo apt install -y golang-go
```

如果 `go version` 低于 `1.25`，改用官方包安装（示例：`1.25.0`）：

```bash
cd /tmp
curl -LO https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
echo 'export PATH=/usr/local/go/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
go version
```

可选：安装 `psql`（仅导入演示数据时需要）：

```bash
sudo apt install -y postgresql-client
```

## 3. 环境检查（WSL）

```bash
git --version
docker --version
docker compose version
go version
node -v
npm -v
make --version
```

## 4. 获取代码并进入项目目录

在 WSL 中执行：

```bash
git clone <你的仓库地址>
cd beiqi-mural-guardian
```

如果你是先在 Windows 里克隆的仓库，路径换算规则是：

- `C:\path\to\repo` -> `/mnt/c/path/to/repo`
- `D:\path\to\repo` -> `/mnt/d/path/to/repo`

例如：

```bash
cd /mnt/d/path/to/beiqi-mural-guardian
```

如需快捷命令（可选），把 `<repo_abs_path>` 替换为你的项目绝对路径：

```bash
echo 'beiqi(){ cd <repo_abs_path>/backend; }' >> ~/.bashrc
source ~/.bashrc
```

之后输入 `beiqi` 即可进入后端目录。

## 5. 启动数据库（PostgreSQL）

在项目根目录执行：

```bash
docker compose up -d
docker compose ps
```

预期容器：`beiqi-postgres`，端口 `5432`。

## 6. 启动后端（8080）

### 6.1 初始化环境变量

```bash
cp backend/.env.example backend/.env
```

### 6.2 启动方式 A（推荐，直接 go run）

```bash
cd backend
go run ./cmd/server
```

### 6.3 启动方式 B（热重载 air）

```bash
cd backend
go install github.com/air-verse/air@latest
$(go env GOPATH)/bin/air -c .air.toml
```

### 6.4 启动方式 C（使用 make）

```bash
cd backend
make install-air
make dev
```

### 6.5 后端健康检查

```bash
curl http://localhost:8080/health
```

预期返回：

```json
{"status":"ok"}
```

## 7. 启动前端（5173）

另开一个 WSL 终端，在项目根目录执行：

```bash
cd frontend
npm install
npm run dev
```

访问地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`

开发环境下，前端会将 `/api` 和 `/uploads` 代理到 `http://localhost:8080`。

## 8. 可选：导入演示数据

在项目根目录执行：

```bash
cd backend
PGPASSWORD="beiqi123" psql -h localhost -p 5432 -U beiqi -d beiqi_mural -f ./scripts/seed_demo_data.sql
```

## 9. 可选：配置知识库问答 LLM

编辑 `backend/.env`：

```env
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=你的key
LLM_MODEL=deepseek-chat
```

不配置时，知识库问答会自动降级为检索摘要。

## 10. 停止服务

- 停止前后端：对应终端按 `Ctrl + C`
- 停止数据库：

```bash
docker compose down
```

如需清空数据库卷：

```bash
docker compose down -v
```

## 11. WSL 常见问题

1. `sudo` 密码一直错误  
   `sudo` 需要的是 WSL Linux 用户密码（不是 Windows PIN）。输入时终端不会显示字符。忘记可在 PowerShell 执行 `wsl -u root` 后用 `passwd <用户名>` 重置。

2. `make: command not found`  
   执行 `sudo apt update && sudo apt install -y make`，再用 `make --version` 验证。

3. Docker 在 WSL 中不可用  
   确认 Docker Desktop 已运行，并在 Docker Desktop 设置中开启 WSL Integration（对应你的发行版）。

4. 端口冲突（`5432/8080/5173`）  
   修改 `docker-compose.yml`、`backend/.env` 的 `SERVER_PORT`，或 `frontend/vite.config.ts` 的端口。

5. 图片 404  
   建议在 `backend/.env` 把 `UPLOAD_DIR` 改为绝对路径，例如：`/mnt/d/path/to/beiqi-mural-guardian/uploads`。
