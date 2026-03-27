package serializer

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// genValidMuralJSON 生成有效的 MuralJSON
func genValidMuralJSON() gopter.Gen {
	return func(params *gopter.GenParameters) *gopter.GenResult {
		nameResult, _ := gen.AlphaString()(params).Retrieve()
		eraResult, _ := gen.AlphaString()(params).Retrieve()
		siteResult, _ := gen.AlphaString()(params).Retrieve()
		materialResult, _ := gen.AlphaString()(params).Retrieve()

		name := nameResult.(string)
		era := eraResult.(string)
		site := siteResult.(string)
		material := materialResult.(string)
		if name == "" {
			name = "a"
		}
		if era == "" {
			era = "北齐"
		}
		if site == "" {
			site = "太原"
		}
		if material == "" {
			material = "石灰"
		}

		hi := 50.0
		now := time.Now().Truncate(time.Second)
		m := &MuralJSON{
			ID: "test-id", Name: name, Era: era, Site: site, Material: material,
			Status: "registered", HealthIndex: &hi, IsFeatured: false,
			CreatedAt: now, UpdatedAt: now,
		}
		return gopter.NewGenResult(m, gopter.NoShrinker)
	}
}

// Feature: northern-qi-mural-restoration, Property 1: 壁画记录 JSON 往返一致性
// Validates: Requirements 10.1, 10.2
func TestProperty1_MuralJSONRoundTrip(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())
	properties.Property("序列化后反序列化应得到等价对象", prop.ForAll(
		func(m *MuralJSON) bool {
			jsonStr, err := SerializeMural(m)
			if err != nil {
				return false
			}
			restored, err := DeserializeMural(jsonStr)
			if err != nil {
				return false
			}
			return m.Name == restored.Name &&
				m.Era == restored.Era &&
				m.Site == restored.Site &&
				m.Material == restored.Material &&
				m.Status == restored.Status &&
				m.IsFeatured == restored.IsFeatured &&
				m.ID == restored.ID
		},
		genValidMuralJSON(),
	))
	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 4: 无效 JSON 数据校验
// Validates: Requirements 10.4
func TestProperty4_InvalidJSONValidation(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("缺少必填字段应返回对应字段的校验错误", prop.ForAll(
		func(fieldToRemove string) bool {
			valid := map[string]interface{}{
				"name": "测试壁画", "era": "北齐", "site": "太原", "material": "石灰",
			}
			delete(valid, fieldToRemove)
			data, _ := json.Marshal(valid)
			errs := ValidateMuralJSON(string(data))
			if errs == nil {
				return false
			}
			for _, e := range errs.Errors {
				if e.Field == fieldToRemove {
					return true
				}
			}
			return false
		},
		gen.OneConstOf("name", "era", "site", "material"),
	))

	properties.Property("无效 JSON 格式应返回解析错误", prop.ForAll(
		func(s string) bool {
			invalidJSON := "{invalid:" + s
			errs := ValidateMuralJSON(invalidJSON)
			return errs != nil && len(errs.Errors) > 0 && errs.Errors[0].Field == "_json"
		},
		gen.AlphaString(),
	))

	properties.Property("健康指数超出 0-100 范围应返回错误", prop.ForAll(
		func(hi float64) bool {
			data, _ := json.Marshal(map[string]interface{}{
				"name": "测试", "era": "北齐", "site": "太原", "material": "石灰",
				"healthIndex": hi,
			})
			errs := ValidateMuralJSON(string(data))
			if hi < 0 || hi > 100 {
				if errs == nil {
					return false
				}
				for _, e := range errs.Errors {
					if e.Field == "healthIndex" {
						return true
					}
				}
				return false
			}
			return errs == nil
		},
		gen.OneConstOf(-1.0, -50.0, 101.0, 200.0, 0.0, 50.0, 100.0),
	))

	properties.TestingRun(t)
}
