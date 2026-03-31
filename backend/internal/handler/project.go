package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type ProjectHandler struct {
	svc *service.ProjectService
	db  *gorm.DB
}

func NewProjectHandler(svc *service.ProjectService, db *gorm.DB) *ProjectHandler {
	return &ProjectHandler{svc: svc, db: db}
}

// Create 创建项目
func (h *ProjectHandler) Create(c *gin.Context) {
	var req struct {
		Name        string   `json:"name" binding:"required"`
		Description *string  `json:"description"`
		Budget      *float64 `json:"budget"`
		MuralIDs    []string `json:"muralIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	p := &model.Project{Name: req.Name, Description: req.Description, Budget: req.Budget}
	if err := h.svc.Create(p, req.MuralIDs); err != nil {
		response.ServerError(c)
		return
	}
	// 重新加载完整数据
	full, _ := h.svc.GetByID(p.ID)
	response.Created(c, full)
}

// GetByID 获取项目详情
func (h *ProjectHandler) GetByID(c *gin.Context) {
	p, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "项目")
		return
	}
	response.OK(c, p)
}

// List 获取项目列表
func (h *ProjectHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	projects, total, err := h.svc.List(c.Query("status"), page, pageSize)
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OKPaginated(c, projects, total, page, pageSize)
}

// Complete 标记项目完成
func (h *ProjectHandler) Complete(c *gin.Context) {
	incomplete, err := h.svc.CompleteProject(c.Param("id"))
	if err != nil {
		if len(incomplete) > 0 {
			response.Conflict(c, "存在未完成的任务")
			return
		}
		response.NotFound(c, "项目")
		return
	}
	response.OK(c, gin.H{"message": "项目已完成"})
}

// CreateTask 创建任务
func (h *ProjectHandler) CreateTask(c *gin.Context) {
	var req struct {
		PhaseID     string  `json:"phaseId" binding:"required"`
		Title       string  `json:"title" binding:"required"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	task := model.RestTask{PhaseID: req.PhaseID, Title: req.Title, Description: req.Description}
	if err := h.db.Create(&task).Error; err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, task)
}

// UpdateTask 更新任务状态
func (h *ProjectHandler) UpdateTask(c *gin.Context) {
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	taskID := c.Param("taskId")
	if err := h.db.Model(&model.RestTask{}).Where("id = ?", taskID).Update("status", req.Status).Error; err != nil {
		response.NotFound(c, "任务")
		return
	}

	// 重算项目进度
	projectID := c.Param("id")
	p, _ := h.svc.GetByID(projectID)
	if p != nil {
		p.Progress = service.CalculateProgress(p.Phases)
		h.db.Model(p).Update("progress", p.Progress)
	}

	response.OK(c, gin.H{"message": "任务状态已更新"})
}

// AssignTask 分配任务给用户
func (h *ProjectHandler) AssignTask(c *gin.Context) {
	var req struct {
		UserIDs []string `json:"userIds" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	taskID := c.Param("taskId")
	var task model.RestTask
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		response.NotFound(c, "任务")
		return
	}
	// 清除旧分配，重新关联
	var users []model.User
	h.db.Where("id IN ?", req.UserIDs).Find(&users)
	h.db.Model(&task).Association("Assignees").Replace(users)
	response.OK(c, gin.H{"message": "任务已分配"})
}

// UploadAttachment 上传任务附件
func (h *ProjectHandler) UploadAttachment(c *gin.Context) {
	taskID := c.Param("taskId")
	var task model.RestTask
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		response.NotFound(c, "任务")
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传文件")
		return
	}
	defer file.Close()

	att := model.TaskAttachment{
		TaskID:   taskID,
		FileName: header.Filename,
		FileSize: header.Size,
		FilePath: "attachments/" + taskID + "/" + header.Filename,
	}
	if err := h.db.Create(&att).Error; err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, att)
}

// AddMaterial 记录材料消耗
func (h *ProjectHandler) AddMaterial(c *gin.Context) {
	var m model.MaterialRecord
	if err := c.ShouldBindJSON(&m); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	m.ProjectID = c.Param("id")
	if err := h.svc.AddMaterial(&m); err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, m)
}

// Update 编辑项目基本信息
func (h *ProjectHandler) Update(c *gin.Context) {
	var req struct {
		Name        *string  `json:"name"`
		Description *string  `json:"description"`
		Budget      *float64 `json:"budget"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Budget != nil {
		updates["budget"] = *req.Budget
	}
	if len(updates) == 0 {
		response.BadRequest(c, "无更新字段")
		return
	}
	if err := h.db.Model(&model.Project{}).Where("id = ?", c.Param("id")).Updates(updates).Error; err != nil {
		response.NotFound(c, "项目")
		return
	}
	p, _ := h.svc.GetByID(c.Param("id"))
	response.OK(c, p)
}

// Delete 删除项目（级联删除阶段、任务、材料）
func (h *ProjectHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var p model.Project
	if err := h.db.First(&p, "id = ?", id).Error; err != nil {
		response.NotFound(c, "项目")
		return
	}
	// 级联删除
	h.db.Where("project_id = ?", id).Delete(&model.MaterialRecord{})
	var phases []model.ProjectPhase
	h.db.Where("project_id = ?", id).Find(&phases)
	for _, ph := range phases {
		h.db.Where("phase_id = ?", ph.ID).Delete(&model.RestTask{})
	}
	h.db.Where("project_id = ?", id).Delete(&model.ProjectPhase{})
	h.db.Delete(&p)
	response.OK(c, nil)
}
