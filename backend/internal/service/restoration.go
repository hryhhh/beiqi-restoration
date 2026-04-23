package service

import (
	"errors"

	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
)

var (
	ErrMissingSourceFile     = errors.New("missing_source_file")
	ErrMissingMuralID        = errors.New("missing_mural_id")
	ErrPartialNeedsSelection = errors.New("partial_needs_selection")
)

type GenerateRunInput struct {
	MuralID         string
	Mode            model.RestorationMode
	HasSourceFile   bool
	AnnotationIDs   []string
	ManualSelection *domain.AnnotationCoordinates
}

func ValidateGenerateInput(input GenerateRunInput) error {
	if input.MuralID == "" {
		return ErrMissingMuralID
	}
	if !input.HasSourceFile {
		return ErrMissingSourceFile
	}
	if input.Mode == model.RestorationModePartial && len(input.AnnotationIDs) == 0 && input.ManualSelection == nil {
		return ErrPartialNeedsSelection
	}
	return nil
}
