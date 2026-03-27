package service

import (
	"errors"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

// StandardPhases 七个标准修复流程阶段
var StandardPhases = []string{
	"现状调查与评估", "病害机理分析", "清洗/去污", "加固", "补色/全色", "封护", "监测与验收",
}

type ProjectService struct {
	db *gorm.DB
}

func NewProjectService(db *gorm.DB) *ProjectService {
	return &ProjectService{db: db}
}

// Create 创建项目并自动初始化七阶段流程
func (s *ProjectService) Create(p *model.Project, muralIDs []string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(p).Error; err != nil {
			return err
		}
		// 关联壁画
		if len(muralIDs) > 0 {
			var murals []model.Mural
			tx.Where("id IN ?", muralIDs).Find(&murals)
			tx.Model(p).Association("Murals").Replace(murals)
		}
		// 初始化七阶段
		for i, name := range StandardPhases {
			phase := model.ProjectPhase{ProjectID: p.ID, Name: name, Order: i + 1}
			if err := tx.Create(&phase).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *ProjectService) GetByID(id string) (*model.Project, error) {
	var p model.Project
	err := s.db.Preload("Phases.Tasks.Assignees").Preload("Phases.Tasks.Attachments").
		Preload("Murals").Preload("Materials").First(&p, "id = ?", id).Error
	return &p, err
}

func (s *ProjectService) List(status string, page, pageSize int) ([]model.Project, int64, error) {
	query := s.db.Model(&model.Project{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	var total int64
	query.Count(&total)

	var projects []model.Project
	err := query.Preload("Phases").Offset((page - 1) * pageSize).Limit(pageSize).
		Order("created_at DESC").Find(&projects).Error
	return projects, total, err
}

// CalculateProgress 计算项目进度：已完成任务数 / 总任务数 * 100
func CalculateProgress(phases []model.ProjectPhase) float64 {
	var total, completed int
	for _, phase := range phases {
		for _, task := range phase.Tasks {
			total++
			if task.Status == model.TaskCompleted {
				completed++
			}
		}
	}
	if total == 0 {
		return 0
	}
	return float64(completed) / float64(total) * 100
}

// CompleteProject 标记项目完成，校验未完成任务
func (s *ProjectService) CompleteProject(id string) ([]model.RestTask, error) {
	p, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	var incomplete []model.RestTask
	for _, phase := range p.Phases {
		for _, task := range phase.Tasks {
			if task.Status != model.TaskCompleted {
				incomplete = append(incomplete, task)
			}
		}
	}
	if len(incomplete) > 0 {
		return incomplete, errors.New("存在未完成的任务")
	}

	p.Status = model.ProjectCompleted
	p.Progress = 100
	return nil, s.db.Save(p).Error
}

// AddMaterial 记录材料消耗
func (s *ProjectService) AddMaterial(m *model.MaterialRecord) error {
	return s.db.Create(m).Error
}

// TotalMaterialCost 计算项目材料总费用
func TotalMaterialCost(materials []model.MaterialRecord) float64 {
	var total float64
	for _, m := range materials {
		if m.Cost != nil {
			total += *m.Cost
		}
	}
	return total
}
