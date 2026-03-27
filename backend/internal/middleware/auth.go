package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	pkgjwt "github.com/hry/beiqi-mural-guardian/backend/pkg/jwt"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

// JWTAuth JWT 认证中间件
func JWTAuth(jm *pkgjwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "缺少认证令牌")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenStr == authHeader {
			response.Unauthorized(c, "认证令牌格式无效")
			c.Abort()
			return
		}

		claims, err := jm.Parse(tokenStr)
		if err != nil {
			if err == pkgjwt.ErrTokenExpired {
				response.Unauthorized(c, "令牌已过期")
			} else {
				response.Unauthorized(c, "令牌无效")
			}
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("userId", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// RequireRoles RBAC 权限中间件，限制允许访问的角色
func RequireRoles(roles ...model.UserRole) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[string(r)] = true
	}
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			response.Unauthorized(c, "缺少角色信息")
			c.Abort()
			return
		}
		if !allowed[role.(string)] {
			response.Forbidden(c, "权限不足，需要角色: "+strings.Join(roleNames(roles), "/"))
			c.Abort()
			return
		}
		c.Next()
	}
}

func roleNames(roles []model.UserRole) []string {
	names := make([]string, len(roles))
	for i, r := range roles {
		names[i] = string(r)
	}
	return names
}
