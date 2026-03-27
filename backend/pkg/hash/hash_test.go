package hash

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 10: 密码重置链接一次性
// Validates: Requirements 1.7
// 测试密码哈希的正确性（重置流程的基础），一次性令牌逻辑在 handler 集成测试中验证
func TestProperty10_PasswordHashConsistency(t *testing.T) {
	// bcrypt 较慢，减少迭代次数
	params := gopter.DefaultTestParameters()
	params.MinSuccessfulTests = 20
	properties := gopter.NewProperties(params)

	// 生成 6-60 字节的密码（bcrypt 截断 72 字节）
	pwdGen := gen.AlphaString().SuchThat(func(s string) bool { return len(s) >= 6 && len(s) <= 60 })

	properties.Property("哈希后的密码应能被正确验证", prop.ForAll(
		func(pwd string) bool {
			hashed, err := Password(pwd)
			if err != nil {
				return false
			}
			return CheckPassword(pwd, hashed)
		},
		pwdGen,
	))

	properties.Property("错误密码应验证失败", prop.ForAll(
		func(pwd string) bool {
			hashed, err := Password(pwd)
			if err != nil {
				return false
			}
			return !CheckPassword(pwd+"x", hashed)
		},
		pwdGen,
	))

	properties.Property("同一密码两次哈希应产生不同结果", prop.ForAll(
		func(pwd string) bool {
			h1, _ := Password(pwd)
			h2, _ := Password(pwd)
			return h1 != h2
		},
		pwdGen,
	))

	properties.TestingRun(t)
}
