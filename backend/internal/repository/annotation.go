package repository

import (
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

type AnnotationRepository struct {
	db *gorm.DB
}

func NewAnnotationRepository(db *gorm.DB) *AnnotationRepository {
	return &AnnotationRepository{db: db}
}

func (r *AnnotationRepository) Create(a *model.DamageAnnotation) error {
	return r.db.Create(a).Error
}

func (r *AnnotationRepository) GetByID(id string) (*model.DamageAnnotation, error) {
	var a model.DamageAnnotation
	err := r.db.First(&a, "id = ?", id).Error
	return &a, err
}

func (r *AnnotationRepository) Update(a *model.DamageAnnotation) error {
	return r.db.Save(a).Error
}

func (r *AnnotationRepository) Delete(id string) error {
	return r.db.Delete(&model.DamageAnnotation{}, "id = ?", id).Error
}

// ListByMural 获取壁画的标注列表，支持按图层筛选
func (r *AnnotationRepository) ListByMural(muralID string, imageLayer string) ([]model.DamageAnnotation, error) {
	query := r.db.Where("mural_id = ?", muralID)
	if imageLayer != "" {
		query = query.Where("image_layer = ?", imageLayer)
	}
	var annotations []model.DamageAnnotation
	err := query.Order("created_at DESC").Find(&annotations).Error
	return annotations, err
}

// CreateSnapshot 创建标注版本快照
func (r *AnnotationRepository) CreateSnapshot(s *model.AnnotationSnapshot) error {
	return r.db.Create(s).Error
}

// GetSnapshots 获取标注的版本历史
func (r *AnnotationRepository) GetSnapshots(annotationID string) ([]model.AnnotationSnapshot, error) {
	var snapshots []model.AnnotationSnapshot
	err := r.db.Where("annotation_id = ?", annotationID).Order("version ASC").Find(&snapshots).Error
	return snapshots, err
}
