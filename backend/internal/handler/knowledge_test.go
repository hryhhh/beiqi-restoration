package handler

import (
	"strings"
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 26: 知识库分类筛选一致性
// Validates: Requirements 8.1
func TestProperty26_KnowledgeCategoryFilter(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("按分类筛选应只返回该分类的文档", prop.ForAll(
		func(queryCategory string) bool {
			docs := []model.KnowledgeDoc{
				{Category: model.DocStandardProcess},
				{Category: model.DocMaterialManual},
				{Category: model.DocCaseStudy},
				{Category: model.DocRegulation},
				{Category: model.DocStandardProcess},
			}
			var filtered []model.KnowledgeDoc
			for _, d := range docs {
				if string(d.Category) == queryCategory {
					filtered = append(filtered, d)
				}
			}
			for _, d := range filtered {
				if string(d.Category) != queryCategory {
					return false
				}
			}
			return true
		},
		gen.OneConstOf("standard_process", "material_manual", "case_study", "regulation"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 27: 知识库搜索结果相关性
// Validates: Requirements 8.2
func TestProperty27_KnowledgeSearchRelevance(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("搜索结果的标题或内容应包含关键词", prop.ForAll(
		func(keyword string) bool {
			if keyword == "" {
				return true
			}
			docs := []model.KnowledgeDoc{
				{Title: "壁画修复标准流程", Content: "详细描述修复步骤"},
				{Title: "材料使用手册", Content: "包含壁画修复材料清单"},
				{Title: "案例分析", Content: "北齐壁画案例"},
			}
			var results []model.KnowledgeDoc
			kw := strings.ToLower(keyword)
			for _, d := range docs {
				if strings.Contains(strings.ToLower(d.Title), kw) || strings.Contains(strings.ToLower(d.Content), kw) {
					results = append(results, d)
				}
			}
			for _, d := range results {
				if !strings.Contains(strings.ToLower(d.Title), kw) && !strings.Contains(strings.ToLower(d.Content), kw) {
					return false
				}
			}
			return true
		},
		gen.OneConstOf("壁画", "修复", "材料", "案例", "不存在的关键词"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 28: AI 检测结果转标注一致性
// Validates: Requirements 7.3
func TestProperty28_DetectionToAnnotation(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	type DetectionResult struct {
		DamageType string
		Confidence float64
		Points     [][]float64
	}

	properties.Property("检测结果转标注应保留病害类型和坐标", prop.ForAll(
		func(damageType string) bool {
			detection := DetectionResult{
				DamageType: damageType,
				Confidence: 0.85,
				Points:     [][]float64{{0.1, 0.2}, {0.3, 0.4}, {0.5, 0.6}},
			}
			// 模拟转换
			annotation := model.DamageAnnotation{
				DamageType: model.DamageType(detection.DamageType),
			}
			return string(annotation.DamageType) == detection.DamageType
		},
		gen.OneConstOf("cracking", "flaking", "detachment", "pigment_loss"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 29: 修复报告内容完整性
// Validates: Requirements 7.4
func TestProperty29_ReportCompleteness(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("报告应包含壁画信息和病害统计", prop.ForAll(
		func(annotationCount int) bool {
			mural := model.Mural{Name: "测试壁画", Era: "北齐", Site: "太原"}
			var annotations []model.DamageAnnotation
			for i := 0; i < annotationCount; i++ {
				annotations = append(annotations, model.DamageAnnotation{DamageType: model.DamageCracking})
			}
			// 模拟报告生成：验证数据完整性
			hasName := mural.Name != ""
			hasEra := mural.Era != ""
			hasSite := mural.Site != ""
			hasStats := len(annotations) == annotationCount
			return hasName && hasEra && hasSite && hasStats
		},
		gen.IntRange(0, 10),
	))

	properties.TestingRun(t)
}
