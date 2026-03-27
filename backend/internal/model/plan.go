package model

import "time"

// PlanStatus 修复方案状态枚举
type PlanStatus string

const (
	PlanDraft      PlanStatus = "draft"
	PlanPending    PlanStatus = "pending"
	PlanApproved   PlanStatus = "approved"
	PlanRejected   PlanStatus = "rejected"
	PlanInProgress PlanStatus = "in_progress"
	PlanCompleted  PlanStatus = "completed"
)

// ReviewResult 审批结果枚举
type ReviewResult string

const (
	ReviewApproved ReviewResult = "approved" // 通过
	ReviewRejected ReviewResult = "rejected" // 驳回
)

// RestorationPlan 修复方案
type RestorationPlan struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AnnotationID   string     `gorm:"type:uuid;not null;index" json:"annotationId"`
	Method         string     `gorm:"not null" json:"method"`
	Materials      string     `gorm:"not null" json:"materials"`
	ExpectedResult *string    `json:"expectedResult"`
	Status         PlanStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`

	Reviews       []PlanReview       `gorm:"foreignKey:PlanID" json:"reviews,omitempty"`
	StatusChanges []PlanStatusChange `gorm:"foreignKey:PlanID" json:"statusChanges,omitempty"`
}

// PlanReview 方案审批
type PlanReview struct {
	ID         string       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PlanID     string       `gorm:"type:uuid;not null;index" json:"planId"`
	ReviewerID string       `gorm:"type:uuid;not null" json:"reviewerId"`
	Result     ReviewResult `gorm:"type:varchar(10);not null" json:"result"`
	Comment    *string      `json:"comment"`
	CreatedAt  time.Time    `json:"createdAt"`
}

// PlanStatusChange 方案状态变更
type PlanStatusChange struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PlanID     string     `gorm:"type:uuid;not null;index" json:"planId"`
	FromStatus PlanStatus `gorm:"type:varchar(20)" json:"fromStatus"`
	ToStatus   PlanStatus `gorm:"type:varchar(20)" json:"toStatus"`
	ChangedAt  time.Time  `gorm:"default:now()" json:"changedAt"`
}
