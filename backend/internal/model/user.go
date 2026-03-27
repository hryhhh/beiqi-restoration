package model

import "time"

// UserRole 用户角色枚举
type UserRole string

const (
	RoleAdmin         UserRole = "admin"          // 管理员
	RoleChiefRestorer UserRole = "chief_restorer" // 首席修复师
	RoleAssistant     UserRole = "assistant"       // 助理修复师
	RoleResearcher    UserRole = "researcher"      // 研究员
	RoleReviewer      UserRole = "reviewer"        // 审核员
)

// User 用户
type User struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      UserRole  `gorm:"type:varchar(20);default:'researcher'" json:"role"`
	Avatar    *string   `json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// PasswordResetToken 密码重置令牌
type PasswordResetToken struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"type:uuid;not null;index" json:"userId"`
	Token     string    `gorm:"uniqueIndex;not null" json:"-"`
	Used      bool      `gorm:"default:false" json:"used"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}
