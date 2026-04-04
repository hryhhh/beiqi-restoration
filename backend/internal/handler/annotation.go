package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type AnnotationHandler struct {
	svc *service.AnnotationService
	db  *gorm.DB
}

func NewAnnotationHandler(svc *service.AnnotationService, db *gorm.DB) *AnnotationHandler {
	return &AnnotationHandler{svc: svc, db: db}
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
	Description *string                       `json:"description"`
}

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

	annotation := &model.DamageAnnotation{
		MuralID:     c.Param("id"),
		DamageType:  model.DamageType(req.DamageType),
		Severity:    req.Severity,
		ImageLayer:  imageLayer,
		Description: req.Description,
	}

	if err := h.svc.Create(annotation, &req.Coordinates); err != nil {
		response.ServerError(c)
		return
	}

	changedBy := resolveChangedBy(c, h.db)
	if err := createMuralHistoryEntry(
		h.db,
		annotation.MuralID,
		"annotation."+string(annotation.ImageLayer),
		nil,
		historyString(formatAnnotationHistoryValue(*annotation)),
		changedBy,
	); err != nil {
		response.ServerError(c)
		return
	}

	response.Created(c, annotation)
}

func (h *AnnotationHandler) Update(c *gin.Context) {
	var req updateAnnotationReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	existing, err := h.svc.GetByID(c.Param("annotationId"))
	if err != nil {
		response.NotFound(c, "标注")
		return
	}

	var damageType *model.DamageType
	if req.DamageType != nil {
		nextDamageType := model.DamageType(*req.DamageType)
		damageType = &nextDamageType
	}

	updated, changed, err := h.svc.Update(c.Param("annotationId"), req.Coordinates, damageType, req.Severity, req.Description)
	if err != nil {
		response.NotFound(c, "标注")
		return
	}

	if changed {
		changedBy := resolveChangedBy(c, h.db)
		if err := createMuralHistoryEntry(
			h.db,
			existing.MuralID,
			"annotation."+string(existing.ImageLayer),
			historyString(formatAnnotationHistoryValue(*existing)),
			historyString(formatAnnotationHistoryValue(*updated)),
			changedBy,
		); err != nil {
			response.ServerError(c)
			return
		}
	}

	response.OK(c, updated)
}

func (h *AnnotationHandler) Delete(c *gin.Context) {
	existing, err := h.svc.GetByID(c.Param("annotationId"))
	if err != nil {
		response.NotFound(c, "标注")
		return
	}

	if err := h.svc.Delete(c.Param("annotationId")); err != nil {
		response.NotFound(c, "标注")
		return
	}

	changedBy := resolveChangedBy(c, h.db)
	if err := createMuralHistoryEntry(
		h.db,
		existing.MuralID,
		"annotation."+string(existing.ImageLayer),
		historyString(formatAnnotationHistoryValue(*existing)),
		nil,
		changedBy,
	); err != nil {
		response.ServerError(c)
		return
	}

	response.OK(c, gin.H{"message": "删除成功"})
}

func (h *AnnotationHandler) List(c *gin.Context) {
	annotations, err := h.svc.ListByMural(c.Param("id"), c.Query("imageLayer"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, annotations)
}

func (h *AnnotationHandler) GetVersions(c *gin.Context) {
	snapshots, err := h.svc.GetSnapshots(c.Param("annotationId"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, snapshots)
}
