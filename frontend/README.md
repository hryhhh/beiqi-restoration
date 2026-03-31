# Frontend - 北齐壁蕴系统

本目录是北齐壁蕴系统前端工程，基于 React + TypeScript + Vite，负责页面展示、交互、鉴权与 API 调用。

## 技术栈

- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 6
- Tailwind CSS 4
- Zustand 5
- React Router 7

## 运行要求

- Node.js 20+
- npm 10+
- 后端服务已启动（默认 `http://localhost:8080`）

## 安装与启动

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：`http://localhost:5173`

## 构建与检查

```bash
npm run build
npm run lint
```

## 开发代理说明

开发环境通过 `vite.config.ts` 配置代理：

- `/api` -> `http://localhost:8080`
- `/uploads` -> `http://localhost:8080`

因此前端代码中请求后端时，统一使用相对路径（如 `/api/knowledge/qa`、`/uploads/...`）。

## 目录结构

```text
frontend/
├── src/
│   ├── api/              # 接口请求封装
│   ├── components/       # 通用组件（标注、布局、对比等）
│   ├── hooks/            # 自定义 hooks
│   ├── layouts/          # 页面布局
│   ├── pages/            # 路由页面
│   ├── router/           # 路由定义与守卫
│   ├── stores/           # Zustand 状态管理
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   └── constants/        # 常量
├── public/
└── vite.config.ts
```

## 主要页面路由

- `/`：官网落地页
- `/login`：登录页
- `/dashboard`：仪表盘
- `/murals`、`/murals/:id`：壁画列表/详情
- `/projects`、`/projects/:id`：项目列表/详情
- `/plans`：修复方案
- `/analysis`：图像分析
- `/knowledge`：知识库文档页
- `/knowledge/chat`：智能问答页
- `/admin`：管理后台（仅管理员）

## 知识库问答前端行为

- 优先调用流式接口：`POST /api/knowledge/qa/stream`
- 流式不可用时自动降级到普通接口：`POST /api/knowledge/qa`
- 支持 SSE 事件：`start` / `token` / `error` / `done`
- 支持用户主动“停止生成”（AbortController）
- 支持回答中的引用点击，打开文档详情并定位命中段落

## 常见问题

- 页面提示接口不可用：
  - 先检查后端健康检查：`http://localhost:8080/health`
  - 再确认浏览器 Network 中 `/api` 请求状态码
- 图片 404：
  - 确认图片 URL 使用 `/uploads/...`
  - 确认后端 `UPLOAD_DIR` 路径正确
- 5173 端口冲突：
  - 修改 `vite.config.ts` 中 `server.port`

