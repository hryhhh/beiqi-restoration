package middleware

import (
	"slices"
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
)

func TestRestorationImageUploadRoles(t *testing.T) {
	expected := []model.UserRole{
		model.RoleAdmin,
		model.RoleChiefRestorer,
		model.RoleAssistant,
		model.RoleResearcher,
	}

	if got := RestorationImageUploadRoles(); !slices.Equal(got, expected) {
		t.Fatalf("expected restoration image upload roles %v, got %v", expected, got)
	}
}
