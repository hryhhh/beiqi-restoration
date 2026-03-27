package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

type AnalysisHandler struct{}

func NewAnalysisHandler() *AnalysisHandler {
	return &AnalysisHandler{}
}

// Detect AI 检测（预留接口）
func (h *AnalysisHandler) Detect(c *gin.Context) {
	// TODO: 对接 AI 服务
	response.ServiceUnavailable(c, "AI 检测服务暂不可用，请使用手动标注")
}

// Confirm 确认检测结果转标注（预留接口）
func (h *AnalysisHandler) Confirm(c *gin.Context) {
	response.ServiceUnavailable(c, "AI 检测服务暂不可用")
}

// Report 生成修复报告（预留接口）
func (h *AnalysisHandler) Report(c *gin.Context) {
	response.ServiceUnavailable(c, "报告生成服务暂不可用")
}
