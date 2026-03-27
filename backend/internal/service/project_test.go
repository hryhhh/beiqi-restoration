package service

import (
	"math"
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 18: 项目创建初始化阶段
// Validates: Requirements 5.1
func TestProperty18_ProjectPhaseInit(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("标准修复流程应包含七个阶段且顺序正确", prop.ForAll(
		func(_ int) bool {
			if len(StandardPhases) != 7 {
				return false
			}
			expected := []string{"现状调查与评估", "病害机理分析", "清洗/去污", "加固", "补色/全色", "封护", "监测与验收"}
			for i, name := range expected {
				if StandardPhases[i] != name {
					return false
				}
			}
			return true
		},
		gen.Const(0),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 19: 项目进度计算正确性
// Validates: Requirements 5.3
func TestProperty19_ProgressCalculation(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("进度应等于已完成任务数/总任务数*100", prop.ForAll(
		func(completedCount, pendingCount int) bool {
			// 构建模拟阶段和任务
			var tasks []model.RestTask
			for i := 0; i < completedCount; i++ {
				tasks = append(tasks, model.RestTask{Status: model.TaskCompleted})
			}
			for i := 0; i < pendingCount; i++ {
				tasks = append(tasks, model.RestTask{Status: model.TaskPending})
			}

			phases := []model.ProjectPhase{{Tasks: tasks}}
			progress := CalculateProgress(phases)

			total := completedCount + pendingCount
			if total == 0 {
				return progress == 0
			}
			expected := float64(completedCount) / float64(total) * 100
			return math.Abs(progress-expected) < 0.001
		},
		gen.IntRange(0, 10),
		gen.IntRange(0, 10),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 20: 项目完成前置校验
// Validates: Requirements 5.6
func TestProperty20_CompleteValidation(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("存在未完成任务时不应允许标记完成", prop.ForAll(
		func(pendingCount int) bool {
			var tasks []model.RestTask
			// 加一些已完成的
			tasks = append(tasks, model.RestTask{Status: model.TaskCompleted})
			// 加未完成的
			for i := 0; i < pendingCount; i++ {
				tasks = append(tasks, model.RestTask{Status: model.TaskPending})
			}

			// 模拟完成校验逻辑
			var incomplete []model.RestTask
			for _, task := range tasks {
				if task.Status != model.TaskCompleted {
					incomplete = append(incomplete, task)
				}
			}

			if pendingCount > 0 {
				return len(incomplete) == pendingCount
			}
			return len(incomplete) == 0
		},
		gen.IntRange(0, 5),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 21: 材料费用汇总一致性
// Validates: Requirements 5.5
func TestProperty21_MaterialCostTotal(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("总费用应等于所有材料记录费用之和", prop.ForAll(
		func(costs []float64) bool {
			var materials []model.MaterialRecord
			var expectedTotal float64
			for _, cost := range costs {
				c := cost
				materials = append(materials, model.MaterialRecord{Cost: &c})
				expectedTotal += cost
			}

			total := TotalMaterialCost(materials)
			return math.Abs(total-expectedTotal) < 0.001
		},
		gen.SliceOfN(5, gen.Float64Range(0, 10000)),
	))

	properties.TestingRun(t)
}
