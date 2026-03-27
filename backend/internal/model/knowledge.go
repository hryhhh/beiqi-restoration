package model

import "time"

// DocCategory 知识库文档分类
type DocCategory string

const (
	DocStandardProcess DocCategory = "standard_process" // 标准流程
	DocMaterialManual  DocCategory = "material_manual"  // 材料手册
	DocCaseStudy       DocCategory = "case_study"       // 案例库
	DocRegulation      DocCategory = "regulation"       // 法规文件
)

// KnowledgeDoc 知识库文档
type KnowledgeDoc struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title     string      `gorm:"not null" json:"title"`
	Content   string      `gorm:"type:text" json:"content"`
	Category  DocCategory `gorm:"type:varchar(30);not null" json:"category"`
	FilePath  *string     `json:"filePath"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
}
