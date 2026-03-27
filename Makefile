.PHONY: dev dev-fe dev-be build-fe build-be

# 启动前端开发服务器
dev-fe:
	cd frontend && npm run dev

# 启动后端开发服务器
dev-be:
	cd backend && make run

# 构建前端
build-fe:
	cd frontend && npm run build

# 构建后端
build-be:
	cd backend && make build
