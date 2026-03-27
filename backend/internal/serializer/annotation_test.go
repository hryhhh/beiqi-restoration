package serializer

import (
	"encoding/json"
	"math"
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// genAnnotationText 生成随机的 AnnotationText 对象
func genAnnotationText() gopter.Gen {
	return func(params *gopter.GenParameters) *gopter.GenResult {
		sevResult, _ := gen.IntRange(1, 5)(params).Retrieve()
		severity := sevResult.(int)

		// 生成 3 个坐标点
		points := make([][]float64, 3)
		for i := 0; i < 3; i++ {
			xResult, _ := gen.Float64Range(0, 1)(params).Retrieve()
			yResult, _ := gen.Float64Range(0, 1)(params).Retrieve()
			points[i] = []float64{roundCoord(xResult.(float64)), roundCoord(yResult.(float64))}
		}

		pct := 2.35
		desc := "测试描述"
		a := &AnnotationText{
			ID: "anno1", DamageType: "cracking", Severity: severity, ImageLayer: "visible",
			Coordinates: domain.AnnotationCoordinates{Type: "polygon", Points: points},
			AreaPercent: &pct, Description: &desc,
		}
		return gopter.NewGenResult(a, gopter.NoShrinker)
	}
}

// Feature: northern-qi-mural-restoration, Property 2: 标注数据文本格式往返一致性
// Validates: Requirements 10.5, 10.6
func TestProperty2_AnnotationTextRoundTrip(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())
	properties.Property("格式化后解析应得到等价对象", prop.ForAll(
		func(a *AnnotationText) bool {
			text := FormatAnnotation(a)
			restored, err := ParseAnnotation(text)
			if err != nil {
				t.Logf("解析失败: %v", err)
				return false
			}
			if a.ID != restored.ID || a.DamageType != restored.DamageType ||
				a.Severity != restored.Severity || a.ImageLayer != restored.ImageLayer ||
				a.Coordinates.Type != restored.Coordinates.Type {
				return false
			}
			if len(a.Coordinates.Points) != len(restored.Coordinates.Points) {
				return false
			}
			for i, p := range a.Coordinates.Points {
				rp := restored.Coordinates.Points[i]
				if len(p) != len(rp) {
					return false
				}
				for j := range p {
					if math.Abs(p[j]-rp[j]) > 0.00005 {
						return false
					}
				}
			}
			return true
		},
		genAnnotationText(),
	))
	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 3: 标注坐标精度保持
// Validates: Requirements 10.3
func TestProperty3_CoordinatePrecision(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())
	properties.Property("序列化为 JSON 后坐标精度应保持四位小数", prop.ForAll(
		func(x, y float64) bool {
			coords := domain.AnnotationCoordinates{
				Type:   "polygon",
				Points: [][]float64{{roundCoord(x), roundCoord(y)}},
			}
			data, err := json.Marshal(coords)
			if err != nil {
				return false
			}
			var restored domain.AnnotationCoordinates
			if err := json.Unmarshal(data, &restored); err != nil {
				return false
			}
			if len(restored.Points) != 1 || len(restored.Points[0]) != 2 {
				return false
			}
			return math.Abs(coords.Points[0][0]-restored.Points[0][0]) < 0.00005 &&
				math.Abs(coords.Points[0][1]-restored.Points[0][1]) < 0.00005
		},
		gen.Float64Range(0, 1),
		gen.Float64Range(0, 1),
	))
	properties.TestingRun(t)
}
