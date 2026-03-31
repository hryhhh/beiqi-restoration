.PHONY: build run dev install-air test clean tidy

# 构建
build:
	go build -o bin/server ./cmd/server

# 运行
run:
	go run ./cmd/server

# 热重载开发（依赖 air）
dev:
	@AIR_BIN="$${GOBIN:-$$(go env GOPATH)/bin}/air"; \
	if command -v air >/dev/null 2>&1; then \
		air -c .air.toml; \
	elif [ -x "$$AIR_BIN" ]; then \
		"$$AIR_BIN" -c .air.toml; \
	else \
		echo "未检测到 air，请先执行: make install-air"; \
		echo "如果安装后仍不可用，请确认 $$AIR_BIN 存在，且 \$${GOBIN:-$$(go env GOPATH)/bin} 在 PATH 中"; \
		exit 1; \
	fi

# 安装 air（Go 热重载工具）
install-air:
	go install github.com/air-verse/air@latest
	@AIR_BIN="$${GOBIN:-$$(go env GOPATH)/bin}/air"; \
	echo "air 已安装到: $$AIR_BIN"; \
	echo "可直接运行: $$AIR_BIN -v"

# 测试
test:
	go test ./... -v

# 清理
clean:
	rm -rf bin/

# 整理依赖
tidy:
	go mod tidy
