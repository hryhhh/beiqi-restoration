package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Upload   UploadConfig
	Log      LogConfig
	LLM      LLMConfig
}

type LLMConfig struct {
	BaseURL string // OpenAI 兼容 API 地址
	APIKey  string
	Model   string
}

type ServerConfig struct {
	Port int
	Mode string // debug, release, test
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// DSN 返回 PostgreSQL 连接字符串
func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

type JWTConfig struct {
	Secret      string
	ExpireHours int
}

type UploadConfig struct {
	Dir     string
	MaxSize int64 // 字节
}

type LogConfig struct {
	Level string
	File  string
}

// Load 从环境变量加载配置
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnvInt("SERVER_PORT", 8080),
			Mode: getEnv("SERVER_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "beiqi"),
			Password: getEnv("DB_PASSWORD", "beiqi123"),
			DBName:   getEnv("DB_NAME", "beiqi_mural"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "dev-secret-key"),
			ExpireHours: getEnvInt("JWT_EXPIRE_HOURS", 24),
		},
		Upload: UploadConfig{
			Dir:     getEnv("UPLOAD_DIR", "./uploads"),
			MaxSize: getEnvInt64("MAX_UPLOAD_SIZE", 200*1024*1024),
		},
		Log: LogConfig{
			Level: getEnv("LOG_LEVEL", "debug"),
			File:  getEnv("LOG_FILE", ""),
		},
		LLM: LLMConfig{
			BaseURL: getEnv("LLM_BASE_URL", ""),
			APIKey:  getEnv("LLM_API_KEY", ""),
			Model:   getEnv("LLM_MODEL", "gpt-4o-mini"),
		},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			return i
		}
	}
	return fallback
}
