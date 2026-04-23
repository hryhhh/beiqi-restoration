package repository

import (
	"fmt"
	"strconv"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

type RestorationRepository struct {
	db *gorm.DB
}

func NewRestorationRepository(db *gorm.DB) *RestorationRepository {
	return &RestorationRepository{db: db}
}

func (r *RestorationRepository) CreateRunWithResult(run *model.RestorationRun, result *model.RestorationResult) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(run).Error; err != nil {
			return err
		}
		return tx.Create(result).Error
	})
}

func (r *RestorationRepository) GetRunWithResults(id string) (*model.RestorationRun, []model.RestorationResult, error) {
	var run model.RestorationRun
	err := r.db.
		Preload("Results", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		First(&run, "id = ?", id).
		Error
	if err != nil {
		return nil, nil, err
	}
	return &run, run.Results, nil
}

func (r *RestorationRepository) ListRuns(muralID string, limit int) ([]model.RestorationRun, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	var runs []model.RestorationRun
	query := r.db.Model(&model.RestorationRun{}).Order("created_at DESC").Limit(limit)
	if muralID != "" {
		query = query.Where("mural_id = ?", muralID)
	}
	return runs, query.Find(&runs).Error
}

func (r *RestorationRepository) GetResultInRun(runID, resultID string) (*model.RestorationResult, error) {
	var result model.RestorationResult
	err := r.db.First(&result, "id = ? AND run_id = ?", resultID, runID).Error
	return &result, err
}

func (r *RestorationRepository) GetResultWithRun(resultID string) (*model.RestorationResult, *model.RestorationRun, error) {
	var result model.RestorationResult
	if err := r.db.First(&result, "id = ?", resultID).Error; err != nil {
		return nil, nil, err
	}

	var run model.RestorationRun
	if err := r.db.First(&run, "id = ?", result.RunID).Error; err != nil {
		return nil, nil, err
	}
	return &result, &run, nil
}

func (r *RestorationRepository) CreateResultAndUpdateRun(runID string, result *model.RestorationResult) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(result).Error; err != nil {
			return err
		}
		return tx.Model(&model.RestorationRun{}).
			Where("id = ?", runID).
			Updates(map[string]interface{}{
				"latest_result_id": result.ID,
				"status":           model.RestorationRunSucceeded,
			}).
			Error
	})
}

func (r *RestorationRepository) CommitResult(
	run *model.RestorationRun,
	result *model.RestorationResult,
	image *model.MuralImage,
	changedBy string,
) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var maxVersion int
		if err := tx.Model(&model.MuralImage{}).
			Where("mural_id = ? AND image_type = ?", image.MuralID, image.ImageType).
			Select("COALESCE(MAX(version), 0)").
			Scan(&maxVersion).Error; err != nil {
			return err
		}
		image.Version = maxVersion + 1

		if err := tx.Create(image).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.RestorationResult{}).
			Where("id = ?", result.ID).
			Update("committed_mural_image_id", image.ID).
			Error; err != nil {
			return err
		}

		if err := tx.Model(&model.RestorationRun{}).
			Where("id = ?", run.ID).
			Update("committed_result_id", result.ID).
			Error; err != nil {
			return err
		}

		historyValue := fmt.Sprintf("修复工作台结果 %s · 版本 v%s", result.ID, strconv.Itoa(image.Version))
		if err := tx.Create(&model.MuralHistory{
			MuralID:   image.MuralID,
			Field:     "image.restored",
			NewValue:  &historyValue,
			ChangedBy: changedBy,
		}).Error; err != nil {
			return err
		}

		result.CommittedMuralImageID = &image.ID
		run.CommittedResultID = &result.ID
		return nil
	})
}
