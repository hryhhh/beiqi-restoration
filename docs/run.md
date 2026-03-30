1. 安装基础工具（只做一次）

  - Git
  - Docker Desktop（并确保已启动）
  - Go 1.25+（项目 backend/go.mod 是 go 1.25.0）
  - Node.js 20+（建议 20 或 22）和 npm
  - make（macOS/Linux 通常自带；Windows 可用 WSL）

  2. 检查工具是否可用

  git --version
  docker --version
  go version
  node -v
  npm -v
  make -v

  3. 获取代码

  git clone <你的仓库地址>
  cd beiqi-mural-guardian

  4. 启动基础设施（PostgreSQL）

  docker compose up -d
  docker compose ps

  你应看到 beiqi-postgres 运行中，端口 5432 暴露成功。

  5. 启动后端服务

  cd backend
  cp .env.example .env
  make run

  后端默认监听 http://localhost:8080。

  6. 验证后端是否启动成功
     新开一个终端执行：

  curl http://localhost:8080/health

  期望返回：{"status":"ok"}。

  7. 启动前端服务
     再开一个终端执行：

  cd frontend
  npm install
  npm run dev

  前端默认地址：http://localhost:5173。

  8. 打开系统并登录

  - 浏览器访问 http://localhost:5173
  - 首次可先走注册，再登录
  - 前端会把 /api 自动代理到后端 8080，无需手动改地址

  9. 停止项目

  - 停止前后端：在对应终端 Ctrl + C
  - 停止数据库：

  docker compose down

  - 若要连同数据库数据一起清空：

  docker compose down -v

  10. 常见问题（最快排查）

  - 5432 被占用：改 docker-compose.yml 端口，或停掉本机 PostgreSQL
  - 8080/5173 被占用：改后端 SERVER_PORT 或 Vite server.port
  - 后端连不上库：检查 backend/.env 里的 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
  - 前端接口报错：先确认 http://localhost:8080/health 正常
