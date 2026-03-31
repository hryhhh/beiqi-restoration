package handler

import (
	"encoding/csv"
	"fmt"
	"os/exec"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db    *gorm.DB
	dbCfg *config.DatabaseConfig
}

func NewAdminHandler(db *gorm.DB, dbCfg *config.DatabaseConfig) *AdminHandler {
	return &AdminHandler{db: db, dbCfg: dbCfg}
}

// ListUsers 获取用户列表
func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []model.User
	h.db.Select("id, username, email, role, avatar, created_at, updated_at").Order("created_at DESC").Find(&users)
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

// Backup 使用 pg_dump 执行数据库备份
func (h *AdminHandler) Backup(c *gin.Context) {
	filename := fmt.Sprintf("backup_%s.sql", time.Now().Format("20060102_150405"))
	filepath := fmt.Sprintf("./backups/%s", filename)

	// 确保备份目录存在
	_ = exec.Command("mkdir", "-p", "./backups").Run()

	cmd := exec.Command("pg_dump",
		"-h", h.dbCfg.Host,
		"-p", strconv.Itoa(h.dbCfg.Port),
		"-U", h.dbCfg.User,
		"-d", h.dbCfg.DBName,
		"-f", filepath,
	)
	cmd.Env = append(cmd.Environ(), fmt.Sprintf("PGPASSWORD=%s", h.dbCfg.Password))

	if output, err := cmd.CombinedOutput(); err != nil {
		logger.L.Errorf("数据库备份失败: %v, output: %s", err, string(output))
		response.ServerError(c)
		return
	}

	response.OK(c, gin.H{"message": "备份完成", "filename": filename})
}

// Export 导出壁画数据为 CSV
func (h *AdminHandler) Export(c *gin.Context) {
	var murals []model.Mural
	h.db.Find(&murals)

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=export_%s.csv", time.Now().Format("20060102")))
	// 写入 UTF-8 BOM，兼容 Excel 打开
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(c.Writer)
	w.Write([]string{"ID", "名称", "年代", "遗址", "状态", "健康指数", "创建时间"})
	for _, m := range murals {
		hi := ""
		if m.HealthIndex != nil {
			hi = fmt.Sprintf("%.1f", *m.HealthIndex)
		}
		w.Write([]string{m.ID, m.Name, m.Era, m.Site, string(m.Status), hi, m.CreatedAt.Format("2006-01-02")})
	}
	w.Flush()
}

// ResetUserPassword 管理员重置用户密码
func (h *AdminHandler) ResetUserPassword(c *gin.Context) {
	newPwd := "reset123"
	hashed, _ := hash.Password(newPwd)
	h.db.Model(&model.User{}).Where("id = ?", c.Param("id")).Update("password", hashed)
	response.OK(c, gin.H{"message": "密码已重置"})
}

// DeleteUser 删除用户
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&model.User{}, "id = ?", id).Error; err != nil {
		response.NotFound(c, "用户")
		return
	}
	response.OK(c, nil)
}
