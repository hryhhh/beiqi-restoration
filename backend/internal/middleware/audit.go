package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// AuditLog 审计日志中间件，记录所有写操作到 audit_logs 表
func AuditLog(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 只记录写操作
		method := c.Request.Method
		if method == "GET" || method == "OPTIONS" || method == "HEAD" {
			return
		}

		// 未认证的请求不记录（登录/注册等）
		uid, exists := c.Get("userId")
		if !exists {
			return
		}

		// 只记录成功的请求（2xx/3xx）
		status := c.Writer.Status()
		if status >= 400 {
			return
		}

		ip := c.ClientIP()
		log := model.AuditLog{
			UserID:     uid.(string),
			Action:     method,
			TargetType: c.FullPath(),
			TargetID:   extractTargetID(c),
			Details:    datatypes.JSON([]byte(`{"path":"` + c.Request.URL.Path + `"}`)),
			IPAddress:  &ip,
		}

		if err := db.Create(&log).Error; err != nil {
			logger.L.Errorf("审计日志写入失败: %v", err)
		}
	}
}

// extractTargetID 从路由参数中提取目标资源 ID
func extractTargetID(c *gin.Context) string {
	for _, p := range c.Params {
		if p.Key == "id" {
			return p.Value
		}
	}
	return ""
}
