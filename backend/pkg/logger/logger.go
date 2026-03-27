package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var L *zap.SugaredLogger

// Init 初始化结构化日志
func Init(level, file string) {
	lvl := zapcore.DebugLevel
	_ = lvl.UnmarshalText([]byte(level))

	encoderCfg := zap.NewProductionEncoderConfig()
	encoderCfg.TimeKey = "time"
	encoderCfg.EncodeTime = zapcore.ISO8601TimeEncoder

	// 控制台输出
	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderCfg),
		zapcore.AddSync(os.Stdout),
		lvl,
	)

	cores := []zapcore.Core{consoleCore}

	// 文件输出（可选）
	if file != "" {
		f, err := os.OpenFile(file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err == nil {
			fileCore := zapcore.NewCore(
				zapcore.NewJSONEncoder(encoderCfg),
				zapcore.AddSync(f),
				lvl,
			)
			cores = append(cores, fileCore)
		}
	}

	core := zapcore.NewTee(cores...)
	L = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel)).Sugar()
}
