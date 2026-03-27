package model

import (
	"time"

	"gorm.io/datatypes"
)

// DamageType 病害类型枚举
type DamageType string

const (
	// 结构类
	DamageDetachment        DamageType = "detachment"         // 空鼓
	DamageFlaking           DamageType = "flaking"             // 起甲
	DamageSaltEfflorescence DamageType = "salt_efflorescence"  // 酥碱
	DamageCracking          DamageType = "cracking"            // 龟裂/裂缝
	// 表面类
	DamagePigmentLoss DamageType = "pigment_loss" // 颜料层脱落
	DamageFading      DamageType = "fading"        // 褪色/变色
	DamageSoiling     DamageType = "soiling"       // 壁面污染
	// 生物类
	DamageMold   DamageType = "mold"          // 霉斑/菌害
	DamageInsect DamageType = "insect_damage" // 昆虫/动物危害
	DamageRoot   DamageType = "root_damage"   // 植物根系破坏
)

// DamageAnnotation 病害标注
type DamageAnnotation struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MuralID     string         `gorm:"type:uuid;not null;index" json:"muralId"`
	ImageLayer  ImageType      `gorm:"type:varchar(20);default:'visible'" json:"imageLayer"`
	DamageType  DamageType     `gorm:"type:varchar(30);not null" json:"damageType"`
	Severity    int            `gorm:"not null" json:"severity"` // 1-5
	Coordinates datatypes.JSON `gorm:"type:jsonb;not null" json:"coordinates"`
	Area        *float64       `json:"area"`
	AreaPercent *float64       `json:"areaPercent"`
	Description *string        `json:"description"`
	Version     int            `gorm:"default:1" json:"version"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

// AnnotationSnapshot 标注版本快照
type AnnotationSnapshot struct {
	ID           string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AnnotationID string         `gorm:"type:uuid;not null;index" json:"annotationId"`
	Version      int            `json:"version"`
	Coordinates  datatypes.JSON `gorm:"type:jsonb;not null" json:"coordinates"`
	DamageType   DamageType     `gorm:"type:varchar(30)" json:"damageType"`
	Severity     int            `json:"severity"`
	CreatedAt    time.Time      `json:"createdAt"`
}
