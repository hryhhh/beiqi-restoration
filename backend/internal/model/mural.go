package model

import "time"

// MuralStatus 壁画状态枚举
type MuralStatus string

const (
	MuralRegistered MuralStatus = "registered" // 已登记
	MuralAssessing  MuralStatus = "assessing"  // 评估中
	MuralRestoring  MuralStatus = "restoring"  // 修复中
	MuralCompleted  MuralStatus = "completed"  // 已完成
	MuralMonitoring MuralStatus = "monitoring" // 监测中
)

// Mural 壁画记录
type Mural struct {
	ID             string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name           string      `gorm:"not null" json:"name"`
	Era            string      `gorm:"not null" json:"era"`
	Site           string      `gorm:"not null" json:"site"`
	Material       string      `gorm:"not null" json:"material"`
	TombLocation   *string     `json:"tombLocation"`
	ExcavationDate *time.Time  `json:"excavationDate"`
	Dimensions     *string     `json:"dimensions"`
	Description    *string     `json:"description"`
	Status         MuralStatus `gorm:"type:varchar(20);default:'registered'" json:"status"`
	HealthIndex    *float64    `json:"healthIndex"`
	IsFeatured     bool        `gorm:"default:false" json:"isFeatured"`
	CreatedAt      time.Time   `json:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt"`

	Images      []MuralImage      `gorm:"foreignKey:MuralID" json:"images,omitempty"`
	Annotations []DamageAnnotation `gorm:"foreignKey:MuralID" json:"annotations,omitempty"`
}

// ImageType 图像类型枚举
type ImageType string

const (
	ImageVisible     ImageType = "visible"     // 可见光
	ImageInfrared    ImageType = "infrared"    // 红外
	ImageUltraviolet ImageType = "ultraviolet" // 紫外
	ImageRestored    ImageType = "restored"    // 修复后
)

// MuralImage 壁画图像
type MuralImage struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MuralID       string    `gorm:"type:uuid;not null;index" json:"muralId"`
	FilePath      string    `gorm:"not null" json:"filePath"`
	FileHash      string    `gorm:"not null" json:"fileHash"`
	ImageType     ImageType `gorm:"type:varchar(20);default:'visible'" json:"imageType"`
	Version       int       `gorm:"default:1" json:"version"`
	Width         int       `json:"width"`
	Height        int       `json:"height"`
	FileSize      int64     `json:"fileSize"`
	ThumbnailPath *string   `json:"thumbnailPath"`
	WebpPath      *string   `json:"webpPath"`
	CreatedAt     time.Time `json:"createdAt"`
}

// MuralHistory 壁画修改历史
type MuralHistory struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MuralID   string    `gorm:"type:uuid;not null;index" json:"muralId"`
	Field     string    `gorm:"not null" json:"field"`
	OldValue  *string   `json:"oldValue"`
	NewValue  *string   `json:"newValue"`
	ChangedBy string    `gorm:"not null" json:"changedBy"`
	ChangedAt time.Time `gorm:"default:now()" json:"changedAt"`
}
