package model

import "time"

// ProjectStatus 项目状态枚举
type ProjectStatus string

const (
	ProjectPending    ProjectStatus = "pending"     // 待评估
	ProjectInProgress ProjectStatus = "in_progress" // 修复中
	ProjectCompleted  ProjectStatus = "completed"   // 已完成
)

// PhaseStatus 阶段状态枚举
type PhaseStatus string

const (
	PhasePending    PhaseStatus = "pending"     // 待开始
	PhaseInProgress PhaseStatus = "in_progress" // 进行中
	PhaseCompleted  PhaseStatus = "completed"   // 已完成
)

// TaskStatus 任务状态枚举
type TaskStatus string

const (
	TaskPending    TaskStatus = "pending"     // 待处理
	TaskInProgress TaskStatus = "in_progress" // 进行中
	TaskCompleted  TaskStatus = "completed"   // 已完成
)

// Project 修复项目
type Project struct {
	ID          string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string        `gorm:"not null" json:"name"`
	Description *string       `json:"description"`
	Status      ProjectStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Progress    float64       `gorm:"default:0" json:"progress"`
	Budget      *float64      `json:"budget"`
	StartDate   *time.Time    `json:"startDate"`
	EndDate     *time.Time    `json:"endDate"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`

	Murals    []Mural          `gorm:"many2many:project_murals" json:"murals,omitempty"`
	Phases    []ProjectPhase   `gorm:"foreignKey:ProjectID" json:"phases,omitempty"`
	Materials []MaterialRecord `gorm:"foreignKey:ProjectID" json:"materials,omitempty"`
}

// ProjectPhase 项目阶段
type ProjectPhase struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProjectID string      `gorm:"type:uuid;not null;index" json:"projectId"`
	Name      string      `gorm:"not null" json:"name"`
	Order     int         `json:"order"`
	Status    PhaseStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`

	Tasks []RestTask `gorm:"foreignKey:PhaseID" json:"tasks,omitempty"`
}

// RestTask 修复任务
type RestTask struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PhaseID     string     `gorm:"type:uuid;not null;index" json:"phaseId"`
	Title       string     `gorm:"not null" json:"title"`
	Description *string    `json:"description"`
	Status      TaskStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	Assignees   []User           `gorm:"many2many:task_assignments" json:"assignees,omitempty"`
	Attachments []TaskAttachment `gorm:"foreignKey:TaskID" json:"attachments,omitempty"`
}

// TaskAttachment 任务附件
type TaskAttachment struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TaskID    string    `gorm:"type:uuid;not null;index" json:"taskId"`
	FilePath  string    `gorm:"not null" json:"filePath"`
	FileName  string    `gorm:"not null" json:"fileName"`
	FileSize  int64     `json:"fileSize"`
	CreatedAt time.Time `json:"createdAt"`
}

// MaterialRecord 材料消耗
type MaterialRecord struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProjectID string    `gorm:"type:uuid;not null;index" json:"projectId"`
	Name      string    `gorm:"not null" json:"name"`
	Quantity  float64   `json:"quantity"`
	Unit      string    `json:"unit"`
	Cost      *float64  `json:"cost"`
	CreatedAt time.Time `json:"createdAt"`
}
