package handler

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/ports"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type AnalysisHandler struct {
	db       *gorm.DB
	detector ports.AIDetector // 可为 nil，表示 AI 服务不可用
}

func NewAnalysisHandler(db *gorm.DB, detector ports.AIDetector) *AnalysisHandler {
	return &AnalysisHandler{db: db, detector: detector}
}

// Detect AI 病害检测
func (h *AnalysisHandler) Detect(c *gin.Context) {
	if h.detector == nil || !h.detector.Available() {
		response.ServiceUnavailable(c, "AI 检测服务暂不可用，请使用手动标注")
		return
	}

	var req struct {
		ImageURL string `json:"imageUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供图像 URL")
		return
	}

	results, err := h.detector.Detect(req.ImageURL)
	if err != nil {
		logger.L.Errorf("AI 检测失败: %v", err)
		response.ServiceUnavailable(c, "AI 检测服务异常，请使用手动标注")
		return
	}

	response.OK(c, results)
}

// Confirm 将 AI 检测结果确认转为标注
func (h *AnalysisHandler) Confirm(c *gin.Context) {
	var req struct {
		MuralID string                 `json:"muralId" binding:"required"`
		Results []ports.DetectionResult `json:"results" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供壁画 ID 和检测结果")
		return
	}

	// 校验壁画存在
	var count int64
	h.db.Model(&model.Mural{}).Where("id = ?", req.MuralID).Count(&count)
	if count == 0 {
		response.NotFound(c, "壁画")
		return
	}

	var annotations []model.DamageAnnotation
	for _, r := range req.Results {
		coords, _ := json.Marshal(r.Coordinates)
		desc := r.Description
		annotations = append(annotations, model.DamageAnnotation{
			MuralID:     req.MuralID,
			DamageType:  r.DamageType,
			Severity:    r.Severity,
			Coordinates: datatypes.JSON(coords),
			Description: &desc,
		})
	}

	if err := h.db.Create(&annotations).Error; err != nil {
		logger.L.Errorf("批量创建标注失败: %v", err)
		response.ServerError(c)
		return
	}

	response.Created(c, gin.H{"count": len(annotations), "annotations": annotations})
}

// Report 生成修复报告
func (h *AnalysisHandler) Report(c *gin.Context) {
	var req struct {
		MuralID string `json:"muralId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请提供壁画 ID")
		return
	}

	// 查询壁画信息
	var mural model.Mural
	if err := h.db.First(&mural, "id = ?", req.MuralID).Error; err != nil {
		response.NotFound(c, "壁画")
		return
	}

	// 查询该壁画所有标注
	var annotations []model.DamageAnnotation
	h.db.Where("mural_id = ?", req.MuralID).Find(&annotations)

	// 按病害类型统计
	typeStats := make(map[model.DamageType]int)
	severitySum := 0
	for _, a := range annotations {
		typeStats[a.DamageType]++
		severitySum += a.Severity
	}

	avgSeverity := 0.0
	if len(annotations) > 0 {
		avgSeverity = float64(severitySum) / float64(len(annotations))
	}

	// 生成报告文本
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# %s 病害检测报告\n\n", mural.Name))
	sb.WriteString(fmt.Sprintf("生成时间：%s\n\n", time.Now().Format("2006-01-02 15:04")))
	sb.WriteString(fmt.Sprintf("## 概况\n\n- 病害标注总数：%d\n- 平均严重程度：%.1f / 5\n\n", len(annotations), avgSeverity))
	sb.WriteString("## 病害类型分布\n\n")
	for dt, cnt := range typeStats {
		sb.WriteString(fmt.Sprintf("- %s：%d 处\n", dt, cnt))
	}

	response.OK(c, gin.H{
		"muralId":       req.MuralID,
		"muralName":     mural.Name,
		"totalDamages":  len(annotations),
		"avgSeverity":   avgSeverity,
		"typeStats":     typeStats,
		"reportContent": sb.String(),
	})
}
