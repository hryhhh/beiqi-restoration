package jwt

import (
	"testing"
	"time"

	jwtgo "github.com/golang-jwt/jwt/v5"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 8: 认证令牌有效性
// Validates: Requirements 1.1, 1.3
func TestProperty8_TokenValidity(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// 有效凭据生成的令牌应包含正确的角色信息
	properties.Property("令牌应包含正确的用户ID和角色", prop.ForAll(
		func(role string) bool {
			m := NewManager("test-secret", 24)
			token, err := m.Generate("user-123", role)
			if err != nil {
				return false
			}
			claims, err := m.Parse(token)
			if err != nil {
				return false
			}
			return claims.UserID == "user-123" && claims.Role == role
		},
		gen.OneConstOf("admin", "chief_restorer", "assistant", "researcher", "reviewer"),
	))

	// 过期令牌应被拒绝
	properties.Property("过期令牌应返回过期错误", prop.ForAll(
		func(role string) bool {
			m := NewManager("test-secret", 24)
			// 手动创建一个已过期的令牌
			claims := Claims{
				UserID: "user-123",
				Role:   role,
				RegisteredClaims: jwtgo.RegisteredClaims{
					ExpiresAt: jwtgo.NewNumericDate(time.Now().Add(-1 * time.Hour)),
					IssuedAt:  jwtgo.NewNumericDate(time.Now().Add(-2 * time.Hour)),
				},
			}
			token := jwtgo.NewWithClaims(jwtgo.SigningMethodHS256, claims)
			tokenStr, _ := token.SignedString([]byte("test-secret"))

			_, err := m.Parse(tokenStr)
			return err == ErrTokenExpired
		},
		gen.OneConstOf("admin", "researcher", "reviewer"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 9: 无效凭据拒绝
// Validates: Requirements 1.2
func TestProperty9_InvalidTokenRejection(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// 无效令牌字符串应被拒绝
	properties.Property("无效令牌应返回无效错误", prop.ForAll(
		func(s string) bool {
			m := NewManager("test-secret", 24)
			_, err := m.Parse("invalid." + s + ".token")
			return err == ErrTokenInvalid
		},
		gen.AlphaString(),
	))

	// 使用错误密钥签名的令牌应被拒绝
	properties.Property("错误密钥签名的令牌应被拒绝", prop.ForAll(
		func(role string) bool {
			m1 := NewManager("secret-1", 24)
			m2 := NewManager("secret-2", 24)
			token, _ := m1.Generate("user-123", role)
			_, err := m2.Parse(token)
			return err == ErrTokenInvalid
		},
		gen.OneConstOf("admin", "researcher"),
	))

	properties.TestingRun(t)
}
