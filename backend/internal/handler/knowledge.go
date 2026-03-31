package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

type KnowledgeHandler struct {
	svc   *service.KnowledgeService
	qaSvc *service.KnowledgeQAService
}

func NewKnowledgeHandler(svc *service.KnowledgeService, qaSvc *service.KnowledgeQAService) *KnowledgeHandler {
	return &KnowledgeHandler{svc: svc, qaSvc: qaSvc}
}

type createKnowledgeReq struct {
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Category string `json:"category" binding:"required"`
}

type updateKnowledgeReq struct {
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Category string `json:"category" binding:"required"`
}

// List 获取文档列表
func (h *KnowledgeHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}

	docs, total, err := h.svc.List(repository.KnowledgeListParams{
		Category: c.Query("category"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OKPaginated(c, docs, total, page, pageSize)
}

// Search 搜索文档
func (h *KnowledgeHandler) Search(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		response.BadRequest(c, "请提供搜索关键词")
		return
	}
	docs, err := h.svc.Search(keyword)
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, docs)
}

// GetByID 获取文档详情
func (h *KnowledgeHandler) GetByID(c *gin.Context) {
	doc, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "文档")
		return
	}
	response.OK(c, doc)
}

// Create 创建文档
func (h *KnowledgeHandler) Create(c *gin.Context) {
	var req createKnowledgeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供标题、内容和分类")
		return
	}
	doc := &model.KnowledgeDoc{
		Title:    req.Title,
		Content:  req.Content,
		Category: model.DocCategory(req.Category),
	}
	if err := h.svc.Create(doc); err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, doc)
}

// Update 更新文档
func (h *KnowledgeHandler) Update(c *gin.Context) {
	var req updateKnowledgeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供标题、内容和分类")
		return
	}
	doc, err := h.svc.Update(c.Param("id"), req.Title, req.Content, model.DocCategory(req.Category))
	if err != nil {
		response.NotFound(c, "文档")
		return
	}
	response.OK(c, doc)
}

// Delete 删除文档
func (h *KnowledgeHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Param("id")); err != nil {
		response.NotFound(c, "文档")
		return
	}
	response.OK(c, nil)
}

// Ask 知识库问答
func (h *KnowledgeHandler) Ask(c *gin.Context) {
	var req struct {
		Question string `json:"question" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供问题")
		return
	}
	result, err := h.qaSvc.Ask(req.Question)
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, result)
}
