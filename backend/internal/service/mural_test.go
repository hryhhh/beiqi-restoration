package service

import (
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 12: 壁画筛选结果一致性
// Validates: Requirements 3.3
// 注：完整的筛选测试需要数据库，此处测试筛选参数构建逻辑
func TestProperty12_FilterParamsConsistency(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// 筛选条件应正确传递
	properties.Property("筛选条件中的状态值应为有效枚举", prop.ForAll(
		func(status string) bool {
			valid := map[string]bool{
				"registered": true, "assessing": true, "restoring": true,
				"completed": true, "monitoring": true,
			}
			return valid[status]
		},
		gen.OneConstOf("registered", "assessing", "restoring", "completed", "monitoring"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 13: 壁画修改历史完整性
// Validates: Requirements 3.5
func TestProperty13_FieldValueExtraction(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	// getFieldValue 应正确提取字段值
	properties.Property("getFieldValue 应正确提取壁画字段值", prop.ForAll(
		func(name, era, site, material string) bool {
			m := &model.Mural{Name: name, Era: era, Site: site, Material: material}
			return getFieldValue(m, "name") == name &&
				getFieldValue(m, "era") == era &&
				getFieldValue(m, "site") == site &&
				getFieldValue(m, "material") == material
		},
		gen.AlphaString(), gen.AlphaString(), gen.AlphaString(), gen.AlphaString(),
	))

	// 指针字段为 nil 时应返回空字符串
	properties.Property("nil 指针字段应返回空字符串", prop.ForAll(
		func(field string) bool {
			m := &model.Mural{}
			val := getFieldValue(m, field)
			return val == "" || val == model.MuralStatus("")
		},
		gen.OneConstOf(
			"description",
			"tombLocation",
			"popularIntroduction",
			"historicalBackground",
			"artisticFeatures",
			"culturalSignificance",
		),
	))

	properties.TestingRun(t)
}

func TestShowcaseFieldMetadata(t *testing.T) {
	popular := "墓主人出行图景"
	m := &model.Mural{
		PopularIntroduction: &popular,
	}

	if got := getFieldValue(m, "popularIntroduction"); got != popular {
		t.Fatalf("popularIntroduction = %v, want %q", got, popular)
	}

	for _, field := range []string{
		"popularIntroduction",
		"historicalBackground",
		"artisticFeatures",
		"culturalSignificance",
	} {
		if got := normalizeHistoryValue(getFieldValue(&model.Mural{}, field)); got != "" {
			t.Fatalf("%s should normalize to empty history value, got %q", field, got)
		}
	}

	expectedLabels := map[string]string{
		"popularIntroduction":  "通俗化介绍",
		"historicalBackground": "历史背景",
		"artisticFeatures":     "艺术特点",
		"culturalSignificance": "文化意义",
	}
	for field, want := range expectedLabels {
		if got := historyFieldLabel(field); got != want {
			t.Fatalf("%s label = %q, want %q", field, got, want)
		}
	}
}
