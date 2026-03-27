package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

type AnnotationHandler struct {
	svc *service.AnnotationService
}

func NewAnnotationHandler(svc *service.AnnotationService) *AnnotationHandler {
	return &AnnotationHandler{svc: svc}
}

type createAnnotationReq struct {
	DamageType  string                       `json:"damageType" binding:"required"`
	Severity    int                          `json:"severity" binding:"required,min=1,max=5"`
	ImageLayer  string                       `json:"imageLayer"`
	Coordinates domain.AnnotationCoordinates `json:"coordinates" binding:"required"`
	Description *string                      `json:"description"`
}

type updateAnnotationReq struct {
	DamageType  *string                       `json:"damageType"`
	Severity    *int                          `json:"severity"`
	Coordinates *domain.AnnotationCoordinates `json:"coordinates"`
}

// Create 创建标注
func (h *AnnotationHandler) Create(c *gin.Context) {
	var req createAnnotationReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	imageLayer := model.ImageType(req.ImageLayer)
	if imageLayer == "" {
		imageLayer = model.ImageVisible
	}

	a := &model.DamageAnnotation{
		MuralID:     c.Param("id"),
		DamageType:  model.DamageType(req.DamageType),
		Severity:    req.Severity,
		ImageLayer:  imageLayer,
		Description: req.Description,
	}

	if err := h.svc.Create(a, &req.Coordinates); err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, a)
}

// Update 更新标注
func (h *AnnotationHandler) Update(c *gin.Context) {
	var req updateAnnotationReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	var dt *model.DamageType
	if req.DamageType != nil {
		d := model.DamageType(*req.DamageType)
		dt = &d
	}

	a, err := h.svc.Update(c.Param("annotationId"), req.Coordinates, dt, req.Severity)
	if err != nil {
		response.NotFound(c, "标注")
		return
	}
	response.OK(c, a)
}

// Delete 删除标注
func (h *AnnotationHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Param("annotationId")); err != nil {
		response.NotFound(c, "标注")
		return
	}
	response.OK(c, gin.H{"message": "删除成功"})
}

// List 获取壁画的标注列表
func (h *AnnotationHandler) List(c *gin.Context) {
	annotations, err := h.svc.ListByMural(c.Param("id"), c.Query("imageLayer"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, annotations)
}

// GetVersions 获取标注版本历史
func (h *AnnotationHandler) GetVersions(c *gin.Context) {
	snapshots, err := h.svc.GetSnapshots(c.Param("annotationId"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, snapshots)
}
