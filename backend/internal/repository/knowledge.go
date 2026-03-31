package repository

import (
	"strings"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

type KnowledgeRepository struct {
	db *gorm.DB
}

func NewKnowledgeRepository(db *gorm.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

type KnowledgeListParams struct {
	Category string
	Page     int
	PageSize int
}

// List 分页查询文档列表
func (r *KnowledgeRepository) List(params KnowledgeListParams) ([]model.KnowledgeDoc, int64, error) {
	query := r.db.Model(&model.KnowledgeDoc{})
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	var total int64
	query.Count(&total)

	var docs []model.KnowledgeDoc
	err := query.Offset((params.Page - 1) * params.PageSize).
		Limit(params.PageSize).
		Order("created_at DESC").
		Find(&docs).Error
	return docs, total, err
}

// Search 关键词搜索（支持分词，任意关键词命中即匹配）
func (r *KnowledgeRepository) Search(keyword string) ([]model.KnowledgeDoc, error) {
	words := splitKeywords(keyword)
	if len(words) == 0 {
		return nil, nil
	}

	// 拼接 OR 条件
	var conditions []string
	var args []interface{}
	for _, w := range words {
		pattern := "%" + w + "%"
		conditions = append(conditions, "(title ILIKE ? OR content ILIKE ?)")
		args = append(args, pattern, pattern)
	}

	var docs []model.KnowledgeDoc
	err := r.db.Where(strings.Join(conditions, " OR "), args...).
		Order("created_at DESC").Find(&docs).Error
	return docs, err
}

// splitKeywords 将查询拆分为独立关键词（按字符逐字拆分中文，按空格拆分英文）
func splitKeywords(s string) []string {
	// 先按空格/标点拆
	parts := strings.FieldsFunc(s, func(r rune) bool {
		return r == ' ' || r == '，' || r == '。' || r == '？' || r == '、' || r == ',' || r == '?' || r == '.'
	})
	// 过滤掉太短的（单字中文保留，因为中文单字也有意义）
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if len(p) > 0 {
			result = append(result, p)
		}
	}
	return result
}

// GetByID 获取文档详情
func (r *KnowledgeRepository) GetByID(id string) (*model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	err := r.db.First(&doc, "id = ?", id).Error
	return &doc, err
}

// Create 创建文档
func (r *KnowledgeRepository) Create(doc *model.KnowledgeDoc) error {
	return r.db.Create(doc).Error
}

// Update 更新文档
func (r *KnowledgeRepository) Update(doc *model.KnowledgeDoc) error {
	return r.db.Save(doc).Error
}

// Delete 删除文档
func (r *KnowledgeRepository) Delete(id string) error {
	return r.db.Delete(&model.KnowledgeDoc{}, "id = ?", id).Error
}
