package ports

import "github.com/hry/beiqi-mural-guardian/backend/internal/model"

// DetectionResult AI 检测结果
type DetectionResult struct {
	DamageType  model.DamageType `json:"damageType"`
	Severity    int              `json:"severity"`
	Confidence  float64          `json:"confidence"`
	Coordinates [][]float64      `json:"coordinates"` // 多边形顶点
	Description string           `json:"description"`
}

// AIDetector AI 检测服务接口
type AIDetector interface {
	// Detect 对图像执行病害检测，返回检测结果列表
	Detect(imageURL string) ([]DetectionResult, error)
	// Available 检查 AI 服务是否可用
	Available() bool
}
