.PHONY: build run test clean tidy

# 构建
build:
	go build -o bin/server ./cmd/server

# 运行
run:
	go run ./cmd/server

# 测试
test:
	go test ./... -v

# 清理
clean:
	rm -rf bin/

# 整理依赖
tidy:
	go mod tidy
