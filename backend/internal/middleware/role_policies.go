package middleware

import "github.com/hry/beiqi-mural-guardian/backend/internal/model"

var (
	adminOnlyRoles = [...]model.UserRole{
		model.RoleAdmin,
	}

	muralManageRoles = [...]model.UserRole{
		model.RoleAdmin,
		model.RoleChiefRestorer,
	}

	muralImageUploadRoles = [...]model.UserRole{
		model.RoleAdmin,
		model.RoleChiefRestorer,
		model.RoleAssistant,
		model.RoleResearcher,
	}

	planReviewRoles = [...]model.UserRole{
		model.RoleReviewer,
	}

	annotationWriteRoles = [...]model.UserRole{
		model.RoleAdmin,
		model.RoleChiefRestorer,
		model.RoleAssistant,
		model.RoleResearcher,
	}
)

func AdminOnlyRoles() []model.UserRole {
	return append([]model.UserRole(nil), adminOnlyRoles[:]...)
}

func MuralManageRoles() []model.UserRole {
	return append([]model.UserRole(nil), muralManageRoles[:]...)
}

func MuralImageUploadRoles() []model.UserRole {
	return append([]model.UserRole(nil), muralImageUploadRoles[:]...)
}

func PlanReviewRoles() []model.UserRole {
	return append([]model.UserRole(nil), planReviewRoles[:]...)
}

func AnnotationWriteRoles() []model.UserRole {
	return append([]model.UserRole(nil), annotationWriteRoles[:]...)
}

func RestorationImageUploadRoles() []model.UserRole {
	return MuralImageUploadRoles()
}
