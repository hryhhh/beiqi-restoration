package domain

// AnnotationCoordinates 标注坐标数据结构（纯业务模型）
type AnnotationCoordinates struct {
	Type   string      `json:"type"`   // "polygon", "rect", "path"
	Points [][]float64 `json:"points"` // 相对坐标点数组，精度四位小数
}
