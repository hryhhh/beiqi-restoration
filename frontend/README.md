# 🎨 Frontend - 北齐壁画守护者前端

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant_Design-6-1677FF?style=for-the-badge&logo=antdesign&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
[![Root README](https://img.shields.io/badge/Docs-Project_README-0A66C2?style=for-the-badge&logo=readthedocs&logoColor=white)](../README.md)
[![Backend README](https://img.shields.io/badge/API-Backend_README-059669?style=for-the-badge&logo=go&logoColor=white)](../backend/README.md)

负责项目官网、登录鉴权、壁画档案、病害标注、修复项目、图像分析、知识库问答和管理后台等页面体验。

![前端视觉预览](./src/assets/images/show.jpg)

## 项目简介 / About

本目录是北齐壁画守护者的前端工程，基于 React + TypeScript + Vite 构建，负责所有页面渲染、交互逻辑、路由控制、接口调用和部分可视化能力。当前代码已经覆盖官网落地页、业务后台页面、SSE 问答交互、图像分析工作台和标注画布等核心入口。

前端默认通过 Vite 开发代理将 `/api` 与 `/uploads` 转发到 `http://localhost:8080`，因此开发环境推荐与后端服务配套启动。更多项目级说明见 [../README.md](../README.md)。

## 技术栈 / Tech Stack

- React 19
- TypeScript 5.9
- Vite 8
- Ant Design 6
- Tailwind CSS 4
- React Router 7
- Zustand 5
- Axios
- ECharts
- Fabric.js
- OpenSeadragon
- Three.js
- Zod

## 项目结构 / Project Structure

```text
frontend/
├── public/                # 静态资源
├── src/
│   ├── api/               # 接口请求封装
│   ├── assets/            # 图片、品牌资源
│   ├── components/        # 通用组件与业务组件
│   ├── constants/         # 常量与映射
│   ├── features/          # 功能性片段
│   ├── hooks/             # 自定义 hooks
│   ├── layouts/           # 页面布局
│   ├── pages/             # 路由页面
│   ├── router/            # 路由定义与权限守卫
│   ├── stores/            # Zustand 状态管理
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
├── package.json
├── vite.config.ts
└── README.md
```

主要页面路由：

- `/`：官网落地页
- `/login`：登录页
- `/dashboard`：仪表盘
- `/murals`、`/murals/:id`：壁画列表与详情
- `/projects`、`/projects/:id`：修复项目列表与详情
- `/analysis`：图像分析
- `/plans`：修复方案
- `/knowledge`：知识库文档
- `/knowledge/chat`：知识库问答
- `/admin`：管理员后台

## 快速开始 / Getting Started

### 前提条件

- Node.js 20+
- npm 10+
- 已启动的后端服务，默认 `http://localhost:8080`

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认访问地址：

- `http://localhost:5173`

### 构建生产包

```bash
npm run build
```

### 本地预览构建结果

```bash
npm run preview
```

## 功能特性 / Features

- ✅ 官网落地页与品牌视觉展示
- ✅ 登录、鉴权态初始化与受保护路由
- ✅ 壁画档案列表、详情、历史记录与图片上传
- ✅ 标注画布、标注面板、几何编辑与病害类型管理
- ✅ 修复项目、任务、材料和附件等业务页面
- ✅ 图像分析工作台，支持上传、检测、生成报告、转标注
- ✅ 知识库文档页与 SSE 流式问答页
- ✅ 管理后台页，覆盖用户、日志、备份与导出入口

## API 集成 / API Notes

前端没有单独维护 Swagger 或 Postman 文档，接口调用主要集中在 `src/api/`。开发时统一使用相对路径，避免在代码里写死后端域名。

Vite 代理配置位于 `vite.config.ts`：

- `/api` -> `http://localhost:8080`
- `/uploads` -> `http://localhost:8080`

知识库问答前端行为：

- 优先调用 `POST /api/knowledge/qa/stream`
- 流式不可用时降级到 `POST /api/knowledge/qa`
- 支持 `start`、`token`、`error`、`done` 四类 SSE 事件
- 支持用户主动停止生成

## 部署 / Deployment

```bash
cd frontend
npm install
npm run build
```

构建产物输出到 `dist/`，可以部署到任意静态托管服务。若部署到 Nginx，请确保：

- 前端静态文件正确指向 `dist/`
- `/api` 请求能被反向代理到后端服务
- `/uploads` 能访问后端静态资源目录

## 测试 / Testing

当前前端以 lint 和构建校验为主：

```bash
npm run lint
npm run build
```

说明：

- `npm run build` 会执行 `tsc -b && vite build`
- 当前没有单独的前端单测脚本

## 常见问题 / Troubleshooting

### 页面打开后提示接口不可用

优先检查：

- 后端是否已启动
- `http://localhost:8080/health` 是否可访问
- 浏览器 Network 面板中 `/api` 请求是否被正确代理

### 图片资源 404

优先检查：

- 页面里是否使用 `/uploads/...` 相对路径
- 后端 `UPLOAD_DIR` 是否和文件实际落盘路径一致

### 5173 端口冲突

修改 `vite.config.ts` 中的 `server.port`，或释放本地端口后重试。

### 图像分析页无法拿到真实检测结果

当前前端有 mock 兜底逻辑；如果后端未注入真实 AI 检测器，页面会展示模拟检测结果而不是实际识别数据。

## 贡献指南 / Contributing

前端相关改动建议：

1. 优先复用 `src/api`、`src/types` 和现有布局组件
2. 保持相对路径请求，不在组件内硬编码后端域名
3. 提交前至少运行 `npm run lint` 与 `npm run build`
4. PR 中说明影响页面、验证路径和截图

## 许可证 / License

本目录遵循项目根目录的 [MIT License](../LICENSE)。

## 更多资源 / Resources

- 项目总览：[../README.md](../README.md)
- 后端文档：[../backend/README.md](../backend/README.md)
- 运行手册：[../docs/run.md](../docs/run.md)
- Windows + WSL 指南：[../WINDOWS_SETUP.md](../WINDOWS_SETUP.md)
