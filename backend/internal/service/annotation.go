package service

import (
	"encoding/json"

	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"gorm.io/datatypes"
)

type AnnotationService struct {
	repo *repository.AnnotationRepository
}

func NewAnnotationService(repo *repository.AnnotationRepository) *AnnotationService {
	return &AnnotationService{repo: repo}
}

// Create 创建标注，自动裁剪坐标并计算面积
func (s *AnnotationService) Create(a *model.DamageAnnotation, coords *domain.AnnotationCoordinates) error {
	// 裁剪坐标到 [0,1]
	domain.ClampCoordinates(coords)

	// 计算面积
	area := domain.PolygonArea(coords.Points)
	pct := domain.AreaPercent(area)
	a.Area = &area
	a.AreaPercent = &pct

	// 序列化坐标
	coordJSON, _ := json.Marshal(coords)
	a.Coordinates = datatypes.JSON(coordJSON)
	a.Version = 1

	return s.repo.Create(a)
}

// Update 更新标注，先保存快照再更新
func (s *AnnotationService) Update(id string, coords *domain.AnnotationCoordinates, damageType *model.DamageType, severity *int) (*model.DamageAnnotation, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 保存修改前的快照
	snapshot := &model.AnnotationSnapshot{
		AnnotationID: id,
		Version:      existing.Version,
		Coordinates:  existing.Coordinates,
		DamageType:   existing.DamageType,
		Severity:     existing.Severity,
	}
	if err := s.repo.CreateSnapshot(snapshot); err != nil {
		return nil, err
	}

	// 更新字段
	if coords != nil {
		domain.ClampCoordinates(coords)
		area := domain.PolygonArea(coords.Points)
		pct := domain.AreaPercent(area)
		existing.Area = &area
		existing.AreaPercent = &pct
		coordJSON, _ := json.Marshal(coords)
		existing.Coordinates = datatypes.JSON(coordJSON)
	}
	if damageType != nil {
		existing.DamageType = *damageType
	}
	if severity != nil {
		existing.Severity = *severity
	}
	existing.Version++

	return existing, s.repo.Update(existing)
}

func (s *AnnotationService) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *AnnotationService) ListByMural(muralID, imageLayer string) ([]model.DamageAnnotation, error) {
	return s.repo.ListByMural(muralID, imageLayer)
}

func (s *AnnotationService) GetSnapshots(annotationID string) ([]model.AnnotationSnapshot, error) {
	return s.repo.GetSnapshots(annotationID)
}
