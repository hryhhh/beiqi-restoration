package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	pkgjwt "github.com/hry/beiqi-mural-guardian/backend/pkg/jwt"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 7: 角色权限映射正确性
// Validates: Requirements 1.4, 1.5, 1.6
func TestProperty7_RolePermissionMapping(t *testing.T) {
	gin.SetMode(gin.TestMode)
	jm := pkgjwt.NewManager("test-secret", 24)

	// 权限映射表：角色 -> 允许的操作集合
	type permCase struct {
		path         string
		allowedRoles []model.UserRole
	}

	cases := []permCase{
		// 管理后台：仅管理员
		{"/api/admin/users", []model.UserRole{model.RoleAdmin}},
		// 知识库上传：仅管理员
		{"/api/knowledge/upload", []model.UserRole{model.RoleAdmin}},
		// 壁画创建：管理员 + 首席修复师
		{"/api/murals/create", []model.UserRole{model.RoleAdmin, model.RoleChiefRestorer}},
		// 壁画图像上传：管理员 + 首席修复师 + 助理修复师 + 研究员
		{"/api/murals/upload-image", []model.UserRole{
			model.RoleAdmin,
			model.RoleChiefRestorer,
			model.RoleAssistant,
			model.RoleResearcher,
		}},
		// 方案审批：仅审核员
		{"/api/plans/review", []model.UserRole{model.RoleReviewer}},
		// 标注创建：管理员 + 首席修复师 + 助理修复师 + 研究员
		{"/api/annotations/create", []model.UserRole{model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher}},
	}

	allRoles := []model.UserRole{
		model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant,
		model.RoleResearcher, model.RoleReviewer,
	}

	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("角色权限映射应与预定义表一致", prop.ForAll(
		func(caseIdx int, roleIdx int) bool {
			pc := cases[caseIdx%len(cases)]
			role := allRoles[roleIdx%len(allRoles)]

			// 构建测试路由
			r := gin.New()
			r.GET(pc.path, JWTAuth(jm), RequireRoles(pc.allowedRoles...), func(c *gin.Context) {
				c.JSON(200, gin.H{"ok": true})
			})

			// 生成令牌
			token, _ := jm.Generate("user-1", string(role))

			req := httptest.NewRequest("GET", pc.path, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// 判断是否应该被允许
			isAllowed := false
			for _, ar := range pc.allowedRoles {
				if ar == role {
					isAllowed = true
					break
				}
			}

			if isAllowed {
				return w.Code == http.StatusOK
			}
			return w.Code == http.StatusForbidden
		},
		gen.IntRange(0, 5),
		gen.IntRange(0, 4),
	))

	properties.TestingRun(t)
}
