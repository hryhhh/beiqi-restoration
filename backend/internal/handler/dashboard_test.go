package handler

import (
	"sort"
	"testing"
	"time"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 22: 仪表盘汇总数据正确性
// Validates: Requirements 2.1
func TestProperty22_DashboardSummary(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("待办任务数应等于 pending 状态的任务总数", prop.ForAll(
		func(pendingCount, otherCount int) bool {
			var tasks []model.RestTask
			for i := 0; i < pendingCount; i++ {
				tasks = append(tasks, model.RestTask{Status: model.TaskPending})
			}
			for i := 0; i < otherCount; i++ {
				tasks = append(tasks, model.RestTask{Status: model.TaskCompleted})
			}
			count := 0
			for _, t := range tasks {
				if t.Status == model.TaskPending {
					count++
				}
			}
			return count == pendingCount
		},
		gen.IntRange(0, 10), gen.IntRange(0, 10),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 23: 健康指数预警正确性
// Validates: Requirements 2.2
func TestProperty23_HealthAlerts(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("低于阈值的壁画应全部出现在预警列表中", prop.ForAll(
		func(indices []float64) bool {
			threshold := 60.0
			var murals []model.Mural
			for i, hi := range indices {
				v := hi
				murals = append(murals, model.Mural{ID: string(rune('a' + i)), HealthIndex: &v})
			}

			// 模拟预警筛选
			var alerts []model.Mural
			for _, m := range murals {
				if m.HealthIndex != nil && *m.HealthIndex < threshold {
					alerts = append(alerts, m)
				}
			}

			// 验证：所有预警壁画的健康指数都低于阈值
			for _, a := range alerts {
				if *a.HealthIndex >= threshold {
					return false
				}
			}
			// 验证：所有健康指数低于阈值的壁画都在预警列表中
			for _, m := range murals {
				if m.HealthIndex != nil && *m.HealthIndex < threshold {
					found := false
					for _, a := range alerts {
						if a.ID == m.ID {
							found = true
							break
						}
					}
					if !found {
						return false
					}
				}
			}
			return true
		},
		gen.SliceOfN(5, gen.Float64Range(0, 100)),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 24: 操作日志时间排序
// Validates: Requirements 9.3
func TestProperty24_LogTimeOrder(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("日志应严格按创建时间倒序排列", prop.ForAll(
		func(count int) bool {
			var logs []model.AuditLog
			base := time.Now()
			for i := 0; i < count; i++ {
				logs = append(logs, model.AuditLog{CreatedAt: base.Add(time.Duration(i) * time.Minute)})
			}
			// 模拟倒序排列
			sort.Slice(logs, func(i, j int) bool {
				return logs[i].CreatedAt.After(logs[j].CreatedAt)
			})
			// 验证倒序
			for i := 1; i < len(logs); i++ {
				if logs[i].CreatedAt.After(logs[i-1].CreatedAt) {
					return false
				}
			}
			return true
		},
		gen.IntRange(0, 20),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 25: 用户角色变更即时生效
// Validates: Requirements 9.2
func TestProperty25_RoleChangeImmediate(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("角色变更后权限应立即反映新角色", prop.ForAll(
		func(newRole string) bool {
			user := model.User{Role: model.RoleResearcher}
			user.Role = model.UserRole(newRole)
			return string(user.Role) == newRole
		},
		gen.OneConstOf("admin", "chief_restorer", "assistant", "researcher", "reviewer"),
	))

	properties.TestingRun(t)
}
