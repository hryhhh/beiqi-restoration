package jwt

import (
	"errors"
	"time"

	jwtgo "github.com/golang-jwt/jwt/v5"
)

var (
	ErrTokenExpired = errors.New("令牌已过期")
	ErrTokenInvalid = errors.New("令牌无效")
)

// Claims 自定义 JWT 声明
type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwtgo.RegisteredClaims
}

// Manager JWT 管理器
type Manager struct {
	secret      []byte
	expireHours int
}

func NewManager(secret string, expireHours int) *Manager {
	return &Manager{secret: []byte(secret), expireHours: expireHours}
}

// Generate 生成 JWT 令牌
func (m *Manager) Generate(userID, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwtgo.RegisteredClaims{
			ExpiresAt: jwtgo.NewNumericDate(time.Now().Add(time.Duration(m.expireHours) * time.Hour)),
			IssuedAt:  jwtgo.NewNumericDate(time.Now()),
		},
	}
	token := jwtgo.NewWithClaims(jwtgo.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// Parse 解析并验证 JWT 令牌
func (m *Manager) Parse(tokenStr string) (*Claims, error) {
	token, err := jwtgo.ParseWithClaims(tokenStr, &Claims{}, func(t *jwtgo.Token) (interface{}, error) {
		return m.secret, nil
	})
	if err != nil {
		if errors.Is(err, jwtgo.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrTokenInvalid
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, ErrTokenInvalid
}
