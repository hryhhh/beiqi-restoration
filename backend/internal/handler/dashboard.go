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

	// 修复进度趋势（最近 12 个月，按月统计已完成项目数和进行中项目数）
	type monthlyTrend struct {
		Month      string `json:"month"`
		Completed  int64  `json:"completed"`
		InProgress int64  `json:"inProgress"`
	}
	var trends []monthlyTrend
	h.db.Raw(`
		SELECT to_char(date_trunc('month', s.m), 'YYYY-MM') AS month,
			COALESCE(SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
			COALESCE(SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress
		FROM generate_series(
			date_trunc('month', NOW()) - interval '11 months',
			date_trunc('month', NOW()),
			interval '1 month'
		) AS s(m)
		LEFT JOIN projects p ON date_trunc('month', p.updated_at) = s.m
		GROUP BY s.m ORDER BY s.m
	`).Scan(&trends)

	response.OK(c, gin.H{
		"statusDistribution": distribution,
		"progressTrend":      trends,
	})
}
