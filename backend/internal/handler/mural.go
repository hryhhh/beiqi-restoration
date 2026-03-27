package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

type MuralHandler struct {
	svc *service.MuralService
}

func NewMuralHandler(svc *service.MuralService) *MuralHandler {
	return &MuralHandler{svc: svc}
}

type createMuralReq struct {
	Name         string  `json:"name" binding:"required"`
	Era          string  `json:"era" binding:"required"`
	Site         string  `json:"site" binding:"required"`
	Material     string  `json:"material" binding:"required"`
	TombLocation *string `json:"tombLocation"`
	Dimensions   *string `json:"dimensions"`
	Description  *string `json:"description"`
}

type updateMuralReq struct {
	Name         *string `json:"name"`
	Era          *string `json:"era"`
	Site         *string `json:"site"`
	Material     *string `json:"material"`
	TombLocation *string `json:"tombLocation"`
	Description  *string `json:"description"`
	Status       *string `json:"status"`
}

// Create 创建壁画记录
func (h *MuralHandler) Create(c *gin.Context) {
	var req createMuralReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, gin.H{"_": "请提供必填字段：名称、年代、出土地点、材质"})
		return
	}

	m := &model.Mural{
		Name: req.Name, Era: req.Era, Site: req.Site, Material: req.Material,
		TombLocation: req.TombLocation, Dimensions: req.Dimensions, Description: req.Description,
	}
	if err := h.svc.Create(m); err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, m)
}

// GetByID 获取壁画详情
func (h *MuralHandler) GetByID(c *gin.Context) {
	m, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "壁画")
		return
	}
	response.OK(c, m)
}

// Update 更新壁画记录
func (h *MuralHandler) Update(c *gin.Context) {
	var req updateMuralReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Era != nil {
		updates["era"] = *req.Era
	}
	if req.Site != nil {
		updates["site"] = *req.Site
	}
	if req.Material != nil {
		updates["material"] = *req.Material
	}
	if req.TombLocation != nil {
		updates["tombLocation"] = *req.TombLocation
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	userID, _ := c.Get("userId")
	m, err := h.svc.Update(c.Param("id"), updates, userID.(string))
	if err != nil {
		response.NotFound(c, "壁画")
		return
	}
	response.OK(c, m)
}

// List 获取壁画列表
func (h *MuralHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	params := repository.MuralListParams{
		Name: c.Query("name"), Site: c.Query("site"), Era: c.Query("era"),
		Material: c.Query("material"), Status: c.Query("status"),
		Page: page, PageSize: pageSize,
	}

	murals, total, err := h.svc.List(params)
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OKPaginated(c, murals, total, page, pageSize)
}

// GetHistory 获取壁画修改历史
func (h *MuralHandler) GetHistory(c *gin.Context) {
	history, err := h.svc.GetHistory(c.Param("id"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, history)
}
