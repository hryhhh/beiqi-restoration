package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type PublicHandler struct {
	db *gorm.DB
}

func NewPublicHandler(db *gorm.DB) *PublicHandler {
	return &PublicHandler{db: db}
}

// Landing 获取官网首页数据
func (h *PublicHandler) Landing(c *gin.Context) {
	// 精选壁画
	var featured []model.Mural
	h.db.Where("is_featured = ?", true).Preload("Images").Limit(6).Find(&featured)

	// 统计数据
	var muralCount, projectCount int64
	h.db.Model(&model.Mural{}).Count(&muralCount)
	h.db.Model(&model.Project{}).Count(&projectCount)

	var completedCount int64
	h.db.Model(&model.Project{}).Where("status = ?", model.ProjectCompleted).Count(&completedCount)

	response.OK(c, gin.H{
		"featured": featured,
		"stats": gin.H{
			"muralCount":     muralCount,
			"projectCount":   projectCount,
			"completedCount": completedCount,
		},
	})
}
