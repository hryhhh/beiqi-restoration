package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// Summary 汇总数据
func (h *DashboardHandler) Summary(c *gin.Context) {
	var pendingTasks, inProgressProjects, muralCount int64
	h.db.Model(&model.RestTask{}).Where("status = ?", model.TaskPending).Count(&pendingTasks)
	h.db.Model(&model.Project{}).Where("status = ?", model.ProjectInProgress).Count(&inProgressProjects)
	h.db.Model(&model.Mural{}).Count(&muralCount)

	response.OK(c, gin.H{
		"pendingTasks":       pendingTasks,
		"inProgressProjects": inProgressProjects,
		"muralCount":         muralCount,
	})
}

// Alerts 健康指数预警
func (h *DashboardHandler) Alerts(c *gin.Context) {
	threshold := 60.0 // 预设阈值
	var alerts []model.Mural
	h.db.Where("health_index IS NOT NULL AND health_index < ?", threshold).
		Select("id, name, health_index").Find(&alerts)
	response.OK(c, alerts)
}

// Charts 图表数据
func (h *DashboardHandler) Charts(c *gin.Context) {
	// 壁画状态分布
	type statusCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var distribution []statusCount
	h.db.Model(&model.Mural{}).Select("status, count(*) as count").Group("status").Scan(&distribution)

	response.OK(c, gin.H{"statusDistribution": distribution})
}
