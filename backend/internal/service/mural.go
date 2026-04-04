package service

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
)

type MuralService struct {
	repo *repository.MuralRepository
}

func NewMuralService(repo *repository.MuralRepository) *MuralService {
	return &MuralService{repo: repo}
}

func (s *MuralService) Create(m *model.Mural) error {
	return s.repo.Create(m)
}

func (s *MuralService) GetByID(id string) (*model.Mural, error) {
	return s.repo.GetByID(id)
}

func (s *MuralService) Update(id string, updates map[string]interface{}, changedBy string) (*model.Mural, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	for field, newValue := range updates {
		oldText := normalizeHistoryValue(getFieldValue(existing, field))
		newText := normalizeHistoryValue(newValue)
		if oldText == newText {
			continue
		}

		entry := &model.MuralHistory{
			MuralID:   id,
			Field:     historyFieldLabel(field),
			OldValue:  stringPointer(oldText),
			NewValue:  stringPointer(newText),
			ChangedBy: changedBy,
		}
		_ = s.repo.CreateHistory(entry)
	}

	if value, ok := updates["name"]; ok {
		existing.Name = value.(string)
	}
	if value, ok := updates["era"]; ok {
		existing.Era = value.(string)
	}
	if value, ok := updates["site"]; ok {
		existing.Site = value.(string)
	}
	if value, ok := updates["material"]; ok {
		existing.Material = value.(string)
	}
	if value, ok := updates["description"]; ok {
		text := value.(string)
		existing.Description = &text
	}
	if value, ok := updates["tombLocation"]; ok {
		text := value.(string)
		existing.TombLocation = &text
	}
	if value, ok := updates["status"]; ok {
		existing.Status = model.MuralStatus(value.(string))
	}

	return existing, s.repo.Update(existing)
}

func (s *MuralService) List(params repository.MuralListParams) ([]model.Mural, int64, error) {
	return s.repo.List(params)
}

func (s *MuralService) GetHistory(muralID string) ([]model.MuralHistory, error) {
	return s.repo.GetHistory(muralID)
}

func getFieldValue(mural *model.Mural, field string) interface{} {
	value := reflect.ValueOf(mural).Elem()
	fieldMap := map[string]string{
		"name":         "Name",
		"era":          "Era",
		"site":         "Site",
		"material":     "Material",
		"description":  "Description",
		"tombLocation": "TombLocation",
		"status":       "Status",
	}

	goField, ok := fieldMap[field]
	if !ok {
		return ""
	}

	target := value.FieldByName(goField)
	if !target.IsValid() {
		return ""
	}

	if target.Kind() == reflect.Ptr {
		if target.IsNil() {
			return ""
		}
		return target.Elem().Interface()
	}

	return target.Interface()
}

func normalizeHistoryValue(value interface{}) string {
	if value == nil {
		return ""
	}

	text := strings.TrimSpace(fmt.Sprintf("%v", value))
	if text == "<nil>" {
		return ""
	}
	return text
}

func historyFieldLabel(field string) string {
	fieldMap := map[string]string{
		"name":         "名称",
		"era":          "年代",
		"site":         "地点",
		"material":     "材质",
		"description":  "描述",
		"tombLocation": "墓葬位置",
		"status":       "状态",
	}
	if label, ok := fieldMap[field]; ok {
		return label
	}
	return field
}

func stringPointer(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	copyValue := value
	return &copyValue
}
