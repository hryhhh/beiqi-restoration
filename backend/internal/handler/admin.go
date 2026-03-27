package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// ListUsers 获取用户列表
func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []model.User
	h.db.Order("created_at DESC").Find(&users)
	response.OK(c, users)
}

// UpdateRole 修改用户角色
func (h *AdminHandler) UpdateRole(c *gin.Context) {
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}
	if err := h.db.Model(&model.User{}).Where("id = ?", c.Param("id")).Update("role", req.Role).Error; err != nil {
		response.NotFound(c, "用户")
		return
	}
	response.OK(c, gin.H{"message": "角色已更新"})
}

// ListLogs 获取操作日志
func (h *AdminHandler) ListLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}

	query := h.db.Model(&model.AuditLog{}).Preload("User")
	if uid := c.Query("userId"); uid != "" {
		query = query.Where("user_id = ?", uid)
	}
	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}

	var total int64
	query.Count(&total)
	var logs []model.AuditLog
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&logs)
	response.OKPaginated(c, logs, total, page, pageSize)
}

// Backup 触发数据备份（简化实现）
func (h *AdminHandler) Backup(c *gin.Context) {
	// TODO: 实际备份逻辑
	response.OK(c, gin.H{"message": "备份已触发"})
}

// Export 导出数据（简化实现）
func (h *AdminHandler) Export(c *gin.Context) {
	// TODO: 实际导出逻辑
	response.OK(c, gin.H{"message": "导出已触发"})
}

// ActivateUser 管理员激活用户（预留）
func (h *AdminHandler) ResetUserPassword(c *gin.Context) {
	newPwd := "reset123" // 简化：重置为默认密码
	hashed, _ := hash.Password(newPwd)
	h.db.Model(&model.User{}).Where("id = ?", c.Param("id")).Update("password", hashed)
	response.OK(c, gin.H{"message": "密码已重置"})
}
