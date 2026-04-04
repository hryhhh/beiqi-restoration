package model

import "time"

type AssetType string

const (
	AssetModel    AssetType = "model"
	AssetPanorama AssetType = "panorama"
)

func (t AssetType) IsValid() bool {
	switch t {
	case AssetModel, AssetPanorama:
		return true
	default:
		return false
	}
}

type MuralAsset struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MuralID   string    `gorm:"type:uuid;not null;index" json:"muralId"`
	AssetType AssetType `gorm:"type:varchar(20);not null;index" json:"assetType"`
	Name      string    `gorm:"not null" json:"name"`
	FilePath  string    `gorm:"not null" json:"filePath"`
	FileHash  string    `gorm:"not null" json:"fileHash"`
	MimeType  string    `gorm:"not null" json:"mimeType"`
	FileSize  int64     `json:"fileSize"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Version   int       `gorm:"default:1" json:"version"`
	IsDefault bool      `gorm:"default:false" json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
}
