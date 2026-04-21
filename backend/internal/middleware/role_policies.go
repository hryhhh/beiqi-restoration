package middleware

import "github.com/hry/beiqi-mural-guardian/backend/internal/model"

func RestorationImageUploadRoles() []model.UserRole {
	return []model.UserRole{
		model.RoleAdmin,
		model.RoleChiefRestorer,
		model.RoleAssistant,
		model.RoleResearcher,
	}
}
