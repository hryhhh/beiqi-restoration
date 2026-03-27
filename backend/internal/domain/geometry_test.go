package domain

import (
	"math"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 5: 坐标边界裁剪
// Validates: Requirements 4.6
func TestProperty5_CoordinateClamp(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// 裁剪后所有坐标应在 [0, 1] 范围内
	properties.Property("裁剪后坐标应在 [0,1] 范围内", prop.ForAll(
		func(xs, ys []float64) bool {
			points := make([][]float64, len(xs))
			for i := range xs {
				points[i] = []float64{xs[i], ys[i]}
			}
			coords := &AnnotationCoordinates{Type: "polygon", Points: points}
			ClampCoordinates(coords)
			for _, p := range coords.Points {
				for _, v := range p {
					if v < 0 || v > 1 {
						return false
					}
				}
			}
			return true
		},
		gen.SliceOfN(5, gen.Float64Range(-2, 3)),
		gen.SliceOfN(5, gen.Float64Range(-2, 3)),
	))

	// 裁剪操作应是幂等的
	properties.Property("裁剪操作应是幂等的（裁剪两次等于裁剪一次）", prop.ForAll(
		func(xs, ys []float64) bool {
			// 第一次裁剪
			points1 := make([][]float64, len(xs))
			for i := range xs {
				points1[i] = []float64{xs[i], ys[i]}
			}
			coords1 := &AnnotationCoordinates{Type: "polygon", Points: points1}
			ClampCoordinates(coords1)

			// 第二次裁剪
			coords2 := &AnnotationCoordinates{Type: "polygon", Points: deepCopyPoints(coords1.Points)}
			ClampCoordinates(coords2)

			// 两次结果应相同
			for i, p := range coords1.Points {
				for j, v := range p {
					if v != coords2.Points[i][j] {
						return false
					}
				}
			}
			return true
		},
		gen.SliceOfN(5, gen.Float64Range(-2, 3)),
		gen.SliceOfN(5, gen.Float64Range(-2, 3)),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 6: 标注面积计算一致性
// Validates: Requirements 4.2
func TestProperty6_AreaCalculation(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// 面积应为正数且不超过 1
	properties.Property("多边形面积应为正数且不超过 1", prop.ForAll(
		func(xs, ys []float64) bool {
			points := make([][]float64, len(xs))
			for i := range xs {
				// 确保坐标在 [0, 1] 范围内
				points[i] = []float64{math.Abs(math.Mod(xs[i], 1)), math.Abs(math.Mod(ys[i], 1))}
			}
			area := PolygonArea(points)
			return area >= 0 && area <= 1
		},
		gen.SliceOfN(4, gen.Float64Range(0, 1)),
		gen.SliceOfN(4, gen.Float64Range(0, 1)),
	))

	// 面积百分比应等于面积乘以 100
	properties.Property("面积百分比应等于面积乘以 100", prop.ForAll(
		func(area float64) bool {
			pct := AreaPercent(area)
			return math.Abs(pct-area*100) < 1e-10
		},
		gen.Float64Range(0, 1),
	))

	properties.TestingRun(t)
}

func deepCopyPoints(points [][]float64) [][]float64 {
	cp := make([][]float64, len(points))
	for i, p := range points {
		cp[i] = make([]float64, len(p))
		copy(cp[i], p)
	}
	return cp
}
