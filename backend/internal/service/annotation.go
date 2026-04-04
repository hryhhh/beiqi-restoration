package service

import (
	"bytes"
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

func (s *AnnotationService) Create(annotation *model.DamageAnnotation, coords *domain.AnnotationCoordinates) error {
	domain.ClampCoordinates(coords)

	area := domain.PolygonArea(coords.Points)
	percent := domain.AreaPercent(area)
	annotation.Area = &area
	annotation.AreaPercent = &percent

	coordJSON, _ := json.Marshal(coords)
	annotation.Coordinates = datatypes.JSON(coordJSON)
	annotation.Version = 1

	return s.repo.Create(annotation)
}

func (s *AnnotationService) GetByID(id string) (*model.DamageAnnotation, error) {
	return s.repo.GetByID(id)
}

func (s *AnnotationService) Update(
	id string,
	coords *domain.AnnotationCoordinates,
	damageType *model.DamageType,
	severity *int,
	description *string,
) (*model.DamageAnnotation, bool, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, false, err
	}

	changed := false
	var coordJSON []byte

	if coords != nil {
		domain.ClampCoordinates(coords)
		coordJSON, _ = json.Marshal(coords)
		if !bytes.Equal(existing.Coordinates, coordJSON) {
			changed = true
		}
	}
	if damageType != nil && existing.DamageType != *damageType {
		changed = true
	}
	if severity != nil && existing.Severity != *severity {
		changed = true
	}
	if description != nil {
		currentDescription := ""
		if existing.Description != nil {
			currentDescription = *existing.Description
		}
		if currentDescription != *description {
			changed = true
		}
	}

	if !changed {
		return existing, false, nil
	}

	snapshot := &model.AnnotationSnapshot{
		AnnotationID: id,
		Version:      existing.Version,
		Coordinates:  existing.Coordinates,
		DamageType:   existing.DamageType,
		Severity:     existing.Severity,
	}
	if err := s.repo.CreateSnapshot(snapshot); err != nil {
		return nil, false, err
	}

	if coords != nil {
		area := domain.PolygonArea(coords.Points)
		percent := domain.AreaPercent(area)
		existing.Area = &area
		existing.AreaPercent = &percent
		existing.Coordinates = datatypes.JSON(coordJSON)
	}
	if damageType != nil {
		existing.DamageType = *damageType
	}
	if severity != nil {
		existing.Severity = *severity
	}
	if description != nil {
		existing.Description = description
	}
	existing.Version++

	updated, saveErr := existing, s.repo.Update(existing)
	return updated, true, saveErr
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
