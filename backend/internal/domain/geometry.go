package domain

import "math"

// ClampCoordinates 将坐标裁剪到 [0, 1] 范围内（幂等操作）
func ClampCoordinates(coords *AnnotationCoordinates) {
	for i, point := range coords.Points {
		for j, v := range point {
			if v < 0 {
				coords.Points[i][j] = 0
			} else if v > 1 {
				coords.Points[i][j] = 1
			}
		}
	}
}

// PolygonArea 使用 Shoelace 公式计算多边形面积（相对坐标，结果在 0-1 之间）
// 输入为相对坐标点数组，至少需要 3 个点
func PolygonArea(points [][]float64) float64 {
	n := len(points)
	if n < 3 {
		return 0
	}

	var area float64
	for i := 0; i < n; i++ {
		j := (i + 1) % n
		if len(points[i]) >= 2 && len(points[j]) >= 2 {
			area += points[i][0] * points[j][1]
			area -= points[j][0] * points[i][1]
		}
	}

	return math.Abs(area) / 2
}

// AreaPercent 计算面积百分比
func AreaPercent(area float64) float64 {
	return area * 100
}
