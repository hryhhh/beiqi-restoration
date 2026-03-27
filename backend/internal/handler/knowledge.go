package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type KnowledgeHandler struct {
	db *gorm.DB
}

func NewKnowledgeHandler(db *gorm.DB) *KnowledgeHandler {
	return &KnowledgeHandler{db: db}
}

// List 获取文档列表
func (h *KnowledgeHandler) List(c *gin.Context) {
	query := h.db.Model(&model.KnowledgeDoc{})
	if cat := c.Query("category"); cat != "" {
		query = query.Where("category = ?", cat)
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}

	var total int64
	query.Count(&total)
	var docs []model.KnowledgeDoc
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&docs)
	response.OKPaginated(c, docs, total, page, pageSize)
}

// Search 搜索文档
func (h *KnowledgeHandler) Search(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		response.BadRequest(c, "请提供搜索关键词")
		return
	}
	var docs []model.KnowledgeDoc
	h.db.Where("title ILIKE ? OR content ILIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&docs)
	response.OK(c, docs)
}

// GetByID 获取文档详情
func (h *KnowledgeHandler) GetByID(c *gin.Context) {
	var doc model.KnowledgeDoc
	if err := h.db.First(&doc, "id = ?", c.Param("id")).Error; err != nil {
		response.NotFound(c, "文档")
		return
	}
	response.OK(c, doc)
}

// Create 上传文档
func (h *KnowledgeHandler) Create(c *gin.Context) {
	var doc model.KnowledgeDoc
	if err := c.ShouldBindJSON(&doc); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	if err := h.db.Create(&doc).Error; err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, doc)
}
