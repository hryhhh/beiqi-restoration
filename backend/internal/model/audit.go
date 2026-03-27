package model

import (
	"time"

	"gorm.io/datatypes"
)

// AuditLog 操作日志
type AuditLog struct {
	ID         string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string         `gorm:"type:uuid;not null;index" json:"userId"`
	Action     string         `gorm:"not null" json:"action"`
	TargetType string         `gorm:"not null" json:"targetType"`
	TargetID   string         `gorm:"not null" json:"targetId"`
	Details    datatypes.JSON `gorm:"type:jsonb" json:"details"`
	IPAddress  *string        `json:"ipAddress"`
	CreatedAt  time.Time      `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
