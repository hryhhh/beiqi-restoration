package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type PlanHandler struct {
	db *gorm.DB
}

func NewPlanHandler(db *gorm.DB) *PlanHandler {
	return &PlanHandler{db: db}
}

// Create 创建修复方案
func (h *PlanHandler) Create(c *gin.Context) {
	var req struct {
		AnnotationID   string  `json:"annotationId" binding:"required"`
		Method         string  `json:"method" binding:"required"`
		Materials      string  `json:"materials" binding:"required"`
		ExpectedResult *string `json:"expectedResult"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	// 校验病害标注存在性
	var anno model.DamageAnnotation
	if err := h.db.First(&anno, "id = ?", req.AnnotationID).Error; err != nil {
		response.NotFound(c, "病害标注")
		return
	}

	plan := model.RestorationPlan{
		AnnotationID: req.AnnotationID, Method: req.Method,
		Materials: req.Materials, ExpectedResult: req.ExpectedResult,
	}
	if err := h.db.Create(&plan).Error; err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, plan)
}

// List 获取方案列表
func (h *PlanHandler) List(c *gin.Context) {
	query := h.db.Model(&model.RestorationPlan{}).Preload("Reviews").Preload("StatusChanges")
	if aid := c.Query("annotationId"); aid != "" {
		query = query.Where("annotation_id = ?", aid)
	}
	var plans []model.RestorationPlan
	query.Order("created_at DESC").Find(&plans)
	response.OK(c, plans)
}

// GetByID 获取方案详情
func (h *PlanHandler) GetByID(c *gin.Context) {
	var plan model.RestorationPlan
	if err := h.db.Preload("Reviews").Preload("StatusChanges").First(&plan, "id = ?", c.Param("id")).Error; err != nil {
		response.NotFound(c, "修复方案")
		return
	}
	response.OK(c, plan)
}

// UpdateStatus 更新方案状态
func (h *PlanHandler) UpdateStatus(c *gin.Context) {
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	var plan model.RestorationPlan
	if err := h.db.First(&plan, "id = ?", c.Param("id")).Error; err != nil {
		response.NotFound(c, "修复方案")
		return
	}

	// 记录状态变更
	change := model.PlanStatusChange{
		PlanID: plan.ID, FromStatus: plan.Status, ToStatus: model.PlanStatus(req.Status),
	}
	h.db.Create(&change)

	plan.Status = model.PlanStatus(req.Status)
	h.db.Save(&plan)
	response.OK(c, plan)
}

// Review 审批方案
func (h *PlanHandler) Review(c *gin.Context) {
	var req struct {
		Result  string  `json:"result" binding:"required"`
		Comment *string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	reviewerID, _ := c.Get("userId")
	review := model.PlanReview{
		PlanID: c.Param("id"), ReviewerID: reviewerID.(string),
		Result: model.ReviewResult(req.Result), Comment: req.Comment,
	}
	h.db.Create(&review)

	// 根据审批结果更新方案状态
	newStatus := model.PlanApproved
	if req.Result == "rejected" {
		newStatus = model.PlanRejected
	}
	h.db.Model(&model.RestorationPlan{}).Where("id = ?", c.Param("id")).Update("status", newStatus)

	response.OK(c, review)
}
