package repository

import (
	"sort"
	"strings"
	"unicode"

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
		return []model.KnowledgeDoc{}, nil
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
	err := r.db.Where(strings.Join(conditions, " OR "), args...).Find(&docs).Error
	if err != nil {
		return nil, err
	}

	lowerKeyword := strings.ToLower(strings.TrimSpace(keyword))
	sort.SliceStable(docs, func(i, j int) bool {
		si := scoreKnowledgeDoc(docs[i], lowerKeyword, words)
		sj := scoreKnowledgeDoc(docs[j], lowerKeyword, words)
		if si == sj {
			return docs[i].CreatedAt.After(docs[j].CreatedAt)
		}
		return si > sj
	})

	return docs, err
}

// splitKeywords 将自然语言问题拆分为可检索关键词（兼容中文问句）
func splitKeywords(s string) []string {
	normalized := strings.ToLower(strings.TrimSpace(s))
	if normalized == "" {
		return nil
	}

	separators := func(r rune) bool {
		return unicode.IsSpace(r) ||
			r == '，' || r == '。' || r == '？' || r == '！' || r == '：' || r == '；' || r == '、' ||
			r == ',' || r == '.' || r == '?' || r == '!' || r == ':' || r == ';'
	}

	parts := strings.FieldsFunc(normalized, separators)
	stopWords := []string{
		"请问", "一下", "一下子", "是什么", "什么是", "什么", "如何", "怎么", "怎样",
		"有关", "关于", "请", "帮我", "给我", "告诉我",
		"的", "了", "吗", "呢", "吧", "啊", "和", "与", "及", "以及", "并", "并且",
	}

	termSet := make(map[string]struct{})
	result := make([]string, 0, 24)
	addTerm := func(term string) {
		term = strings.TrimSpace(term)
		if term == "" {
			return
		}
		runes := []rune(term)
		if containsCJK(term) {
			if len(runes) < 2 {
				return
			}
		} else if len(term) < 2 {
			return
		}
		if _, exists := termSet[term]; exists {
			return
		}
		termSet[term] = struct{}{}
		result = append(result, term)
	}

	addTerm(normalized)
	for _, p := range parts {
		addTerm(p)

		expanded := p
		for _, sw := range stopWords {
			expanded = strings.ReplaceAll(expanded, sw, " ")
		}
		for _, piece := range strings.FieldsFunc(expanded, separators) {
			addTerm(piece)
			// 对中文词增加 2 字子词，提高命中率（如“标准流程”→“流程”）
			if containsCJK(piece) {
				for _, sub := range cjkBigrams(piece) {
					addTerm(sub)
				}
			}
		}
	}

	if len(result) > 32 {
		return result[:32]
	}
	return result
}

func cjkBigrams(term string) []string {
	runes := []rune(strings.TrimSpace(term))
	if len(runes) < 3 {
		return nil
	}
	ret := make([]string, 0, len(runes)-1)
	for i := 0; i+1 < len(runes); i++ {
		ret = append(ret, string(runes[i:i+2]))
	}
	return ret
}

func containsCJK(s string) bool {
	for _, r := range s {
		if unicode.Is(unicode.Han, r) {
			return true
		}
	}
	return false
}

func scoreKnowledgeDoc(doc model.KnowledgeDoc, keyword string, words []string) int {
	title := strings.ToLower(doc.Title)
	content := strings.ToLower(doc.Content)
	score := 0

	if keyword != "" {
		if strings.Contains(title, keyword) {
			score += 120
		}
		if strings.Contains(content, keyword) {
			score += 70
		}
	}

	for _, w := range words {
		w = strings.TrimSpace(strings.ToLower(w))
		if w == "" {
			continue
		}
		wlen := len([]rune(w))
		if strings.Contains(title, w) {
			score += 18 + min(wlen, 12)
		}
		if strings.Contains(content, w) {
			score += 7 + min(wlen, 8)
		}
	}

	score += categoryHintScore(doc.Category, keyword)
	return score
}

func categoryHintScore(category model.DocCategory, keyword string) int {
	keyword = strings.ToLower(keyword)
	if keyword == "" {
		return 0
	}

	hit := func(needles ...string) bool {
		for _, n := range needles {
			if strings.Contains(keyword, n) {
				return true
			}
		}
		return false
	}

	switch category {
	case model.DocStandardProcess:
		if hit("流程", "步骤", "工序", "怎么做", "评估", "加固", "补色", "封护") {
			return 25
		}
	case model.DocMaterialManual:
		if hit("材料", "配比", "清洗剂", "兼容", "树脂", "手册") {
			return 25
		}
	case model.DocCaseStudy:
		if hit("案例", "复盘", "监测", "记录", "实践") {
			return 25
		}
	case model.DocRegulation:
		if hit("规范", "要求", "留痕", "审批", "安全", "归档", "命名") {
			return 25
		}
	}
	return 0
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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
