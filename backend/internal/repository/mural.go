package repository

import (
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

type MuralRepository struct {
	db *gorm.DB
}

func NewMuralRepository(db *gorm.DB) *MuralRepository {
	return &MuralRepository{db: db}
}

func (r *MuralRepository) Create(m *model.Mural) error {
	return r.db.Create(m).Error
}

func (r *MuralRepository) GetByID(id string) (*model.Mural, error) {
	var m model.Mural
	err := r.db.Preload("Images").Preload("Annotations").First(&m, "id = ?", id).Error
	return &m, err
}

func (r *MuralRepository) Update(m *model.Mural) error {
	return r.db.Save(m).Error
}

// List 分页查询壁画列表，支持筛选
func (r *MuralRepository) List(params MuralListParams) ([]model.Mural, int64, error) {
	query := r.db.Model(&model.Mural{})

	if params.Name != "" {
		query = query.Where("name ILIKE ?", "%"+params.Name+"%")
	}
	if params.Site != "" {
		query = query.Where("site ILIKE ?", "%"+params.Site+"%")
	}
	if params.Era != "" {
		query = query.Where("era ILIKE ?", "%"+params.Era+"%")
	}
	if params.Material != "" {
		query = query.Where("material ILIKE ?", "%"+params.Material+"%")
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	var total int64
	query.Count(&total)

	var murals []model.Mural
	err := query.Preload("Images").
		Offset((params.Page - 1) * params.PageSize).
		Limit(params.PageSize).
		Order("created_at DESC").
		Find(&murals).Error

	return murals, total, err
}

func (r *MuralRepository) GetHistory(muralID string) ([]model.MuralHistory, error) {
	var history []model.MuralHistory
	err := r.db.Where("mural_id = ?", muralID).Order("changed_at DESC").Find(&history).Error
	return history, err
}

func (r *MuralRepository) CreateHistory(h *model.MuralHistory) error {
	return r.db.Create(h).Error
}

type MuralListParams struct {
	Name     string
	Site     string
	Era      string
	Material string
	Status   string
	Page     int
	PageSize int
}
