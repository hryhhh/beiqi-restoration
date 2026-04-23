package service

import (
	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
)

type GeneratedImage struct {
	Bytes        []byte
	Ext          string
	Width        int
	Height       int
	FileSize     int64
	IsMock       bool
	ProviderName string
}

type GeneratePrimaryRequest struct {
	SourceBytes     []byte
	ContentType     string
	ParametersJSON  []byte
	AnnotationIDs   []string
	ManualSelection *domain.AnnotationCoordinates
}

type GenerateVariantRequest struct {
	SourceBytes     []byte
	BaseResultBytes []byte
	ParametersJSON  []byte
}

type RestorationProvider interface {
	Name() string
	GeneratePrimary(req GeneratePrimaryRequest) (*GeneratedImage, error)
	GenerateVariant(req GenerateVariantRequest) (*GeneratedImage, error)
}

func NewRestorationProvider(cfg *config.RestorationConfig) RestorationProvider {
	if cfg != nil && cfg.Provider == "http" && cfg.BaseURL != "" {
		return NewHTTPRestorationProvider(cfg)
	}
	return ServerMockRestorationProvider{}
}
