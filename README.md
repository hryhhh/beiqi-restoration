# 北齐壁蕴系统 / Northern Qi Mural Guardian

面向文物保护工作者和研究人员的全栈 Web 应用，用于管理北齐时期壁画的数字化修复工作流程。

## 技术栈

- **前端**：React 19 + TypeScript + Vite + Zustand + Ant Design + Tailwind CSS + Fabric.js + ECharts
- **后端**：Go (Gin) + PostgreSQL + GORM

## 快速开始

```bash
# 启动数据库
docker compose up -d

# 启动后端
cd backend && make run

# 启动前端
cd frontend && npm run dev
```

## 项目结构

```
beiqi-mural-guardian/
├── frontend/          # React 前端
├── backend/           # Go 后端
├── docker-compose.yml # 开发环境
└── Makefile           # 根级命令
```

## 许可证

© 2026 太原北齐壁画博物馆
