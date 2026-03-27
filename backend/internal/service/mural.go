package service

import (
	"fmt"
	"reflect"

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

// Update 更新壁画记录并记录修改历史
func (s *MuralService) Update(id string, updates map[string]interface{}, changedBy string) (*model.Mural, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 记录修改历史
	for field, newVal := range updates {
		oldVal := getFieldValue(existing, field)
		oldStr := fmt.Sprintf("%v", oldVal)
		newStr := fmt.Sprintf("%v", newVal)
		if oldStr != newStr {
			h := &model.MuralHistory{
				MuralID:   id,
				Field:     field,
				OldValue:  &oldStr,
				NewValue:  &newStr,
				ChangedBy: changedBy,
			}
			_ = s.repo.CreateHistory(h)
		}
	}

	// 应用更新
	if v, ok := updates["name"]; ok {
		existing.Name = v.(string)
	}
	if v, ok := updates["era"]; ok {
		existing.Era = v.(string)
	}
	if v, ok := updates["site"]; ok {
		existing.Site = v.(string)
	}
	if v, ok := updates["material"]; ok {
		existing.Material = v.(string)
	}
	if v, ok := updates["description"]; ok {
		s := v.(string)
		existing.Description = &s
	}
	if v, ok := updates["tombLocation"]; ok {
		s := v.(string)
		existing.TombLocation = &s
	}
	if v, ok := updates["status"]; ok {
		existing.Status = model.MuralStatus(v.(string))
	}

	return existing, s.repo.Update(existing)
}

func (s *MuralService) List(params repository.MuralListParams) ([]model.Mural, int64, error) {
	return s.repo.List(params)
}

func (s *MuralService) GetHistory(muralID string) ([]model.MuralHistory, error) {
	return s.repo.GetHistory(muralID)
}

func getFieldValue(m *model.Mural, field string) interface{} {
	v := reflect.ValueOf(m).Elem()
	// JSON 字段名到 Go 字段名的映射
	fieldMap := map[string]string{
		"name": "Name", "era": "Era", "site": "Site", "material": "Material",
		"description": "Description", "tombLocation": "TombLocation", "status": "Status",
	}
	if goField, ok := fieldMap[field]; ok {
		f := v.FieldByName(goField)
		if f.IsValid() {
			if f.Kind() == reflect.Ptr {
				if f.IsNil() {
					return ""
				}
				return f.Elem().Interface()
			}
			return f.Interface()
		}
	}
	return ""
}
