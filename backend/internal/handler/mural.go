package handler

import (
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/storage"
	"gorm.io/gorm"
)

type MuralHandler struct {
	svc     *service.MuralService
	db      *gorm.DB
	storage *storage.LocalStorage
}

func NewMuralHandler(svc *service.MuralService, db *gorm.DB, store *storage.LocalStorage) *MuralHandler {
	return &MuralHandler{svc: svc, db: db, storage: store}
}

type createMuralReq struct {
	Name                 string  `json:"name" binding:"required"`
	Era                  string  `json:"era" binding:"required"`
	Site                 string  `json:"site" binding:"required"`
	Material             string  `json:"material" binding:"required"`
	TombLocation         *string `json:"tombLocation"`
	Dimensions           *string `json:"dimensions"`
	Description          *string `json:"description"`
	PopularIntroduction  *string `json:"popularIntroduction"`
	HistoricalBackground *string `json:"historicalBackground"`
	ArtisticFeatures     *string `json:"artisticFeatures"`
	CulturalSignificance *string `json:"culturalSignificance"`
}

type updateMuralReq struct {
	Name                 *string `json:"name"`
	Era                  *string `json:"era"`
	Site                 *string `json:"site"`
	Material             *string `json:"material"`
	TombLocation         *string `json:"tombLocation"`
	Description          *string `json:"description"`
	Status               *string `json:"status"`
	PopularIntroduction  *string `json:"popularIntroduction"`
	HistoricalBackground *string `json:"historicalBackground"`
	ArtisticFeatures     *string `json:"artisticFeatures"`
	CulturalSignificance *string `json:"culturalSignificance"`
}

func (h *MuralHandler) Create(c *gin.Context) {
	var req createMuralReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, gin.H{"_": "please provide name, era, site and material"})
		return
	}

	m := &model.Mural{
		Name:                 req.Name,
		Era:                  req.Era,
		Site:                 req.Site,
		Material:             req.Material,
		TombLocation:         normalizeOptionalText(req.TombLocation),
		Dimensions:           normalizeOptionalText(req.Dimensions),
		Description:          normalizeOptionalText(req.Description),
		PopularIntroduction:  normalizeOptionalText(req.PopularIntroduction),
		HistoricalBackground: normalizeOptionalText(req.HistoricalBackground),
		ArtisticFeatures:     normalizeOptionalText(req.ArtisticFeatures),
		CulturalSignificance: normalizeOptionalText(req.CulturalSignificance),
	}
	if err := h.svc.Create(m); err != nil {
		response.ServerError(c)
		return
	}
	response.Created(c, m)
}

func (h *MuralHandler) GetByID(c *gin.Context) {
	m, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		response.NotFound(c, "澹佺敾")
		return
	}
	response.OK(c, m)
}

func (h *MuralHandler) Update(c *gin.Context) {
	var req updateMuralReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request payload")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Era != nil {
		updates["era"] = *req.Era
	}
	if req.Site != nil {
		updates["site"] = *req.Site
	}
	if req.Material != nil {
		updates["material"] = *req.Material
	}
	setOptionalTextUpdate(updates, "tombLocation", req.TombLocation)
	setOptionalTextUpdate(updates, "description", req.Description)
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	setOptionalTextUpdate(updates, "popularIntroduction", req.PopularIntroduction)
	setOptionalTextUpdate(updates, "historicalBackground", req.HistoricalBackground)
	setOptionalTextUpdate(updates, "artisticFeatures", req.ArtisticFeatures)
	setOptionalTextUpdate(updates, "culturalSignificance", req.CulturalSignificance)

	changedBy := resolveChangedBy(c, h.db)
	m, err := h.svc.Update(c.Param("id"), updates, changedBy)
	if err != nil {
		response.NotFound(c, "澹佺敾")
		return
	}
	response.OK(c, m)
}

func (h *MuralHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	params := repository.MuralListParams{
		Name:     c.Query("name"),
		Site:     c.Query("site"),
		Era:      c.Query("era"),
		Material: c.Query("material"),
		Status:   c.Query("status"),
		Page:     page,
		PageSize: pageSize,
	}

	murals, total, err := h.svc.List(params)
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OKPaginated(c, murals, total, page, pageSize)
}

func (h *MuralHandler) GetHistory(c *gin.Context) {
	history, err := h.svc.GetHistory(c.Param("id"))
	if err != nil {
		response.ServerError(c)
		return
	}
	response.OK(c, history)
}

func (h *MuralHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var mural model.Mural
	if err := h.db.Preload("Images").Preload("Assets").First(&mural, "id = ?", id).Error; err != nil {
		response.NotFound(c, "澹佺敾")
		return
	}

	imagePaths := collectMuralImagePaths(mural.Images)
	assetPaths := collectMuralAssetPaths(mural.Assets)

	err := h.db.Transaction(func(tx *gorm.DB) error {
		var annotationIDs []string
		if err := tx.Model(&model.DamageAnnotation{}).
			Where("mural_id = ?", id).
			Pluck("id", &annotationIDs).Error; err != nil {
			return err
		}

		if len(annotationIDs) > 0 {
			var planIDs []string
			if err := tx.Model(&model.RestorationPlan{}).
				Where("annotation_id IN ?", annotationIDs).
				Pluck("id", &planIDs).Error; err != nil {
				return err
			}
			if len(planIDs) > 0 {
				if err := tx.Where("plan_id IN ?", planIDs).Delete(&model.PlanReview{}).Error; err != nil {
					return err
				}
				if err := tx.Where("plan_id IN ?", planIDs).Delete(&model.PlanStatusChange{}).Error; err != nil {
					return err
				}
				if err := tx.Where("id IN ?", planIDs).Delete(&model.RestorationPlan{}).Error; err != nil {
					return err
				}
			}
			if err := tx.Where("annotation_id IN ?", annotationIDs).Delete(&model.AnnotationSnapshot{}).Error; err != nil {
				return err
			}
			if err := tx.Where("id IN ?", annotationIDs).Delete(&model.DamageAnnotation{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("mural_id = ?", id).Delete(&model.MuralHistory{}).Error; err != nil {
			return err
		}
		if err := tx.Where("mural_id = ?", id).Delete(&model.MuralImage{}).Error; err != nil {
			return err
		}
		if err := tx.Where("mural_id = ?", id).Delete(&model.MuralAsset{}).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM project_murals WHERE mural_id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Mural{}, "id = ?", id).Error
	})
	if err != nil {
		response.ServerError(c)
		return
	}

	for _, relPath := range imagePaths {
		if err := h.storage.Delete(relPath); err != nil {
			logger.L.Warnf("failed to delete mural image %s: %v", relPath, err)
		}
	}
	for _, relPath := range assetPaths {
		if err := h.storage.Delete(relPath); err != nil {
			logger.L.Warnf("failed to delete mural asset %s: %v", relPath, err)
		}
	}
	if err := h.storage.DeleteDirIfEmpty(filepath.Join("murals", id)); err != nil {
		logger.L.Warnf("failed to delete mural directory %s: %v", id, err)
	}

	response.OK(c, gin.H{"message": "deleted"})
}

func collectMuralImagePaths(images []model.MuralImage) []string {
	paths := make([]string, 0, len(images)*3)
	for _, img := range images {
		if img.FilePath != "" {
			paths = append(paths, img.FilePath)
		}
		if img.ThumbnailPath != nil && *img.ThumbnailPath != "" {
			paths = append(paths, *img.ThumbnailPath)
		}
		if img.WebpPath != nil && *img.WebpPath != "" {
			paths = append(paths, *img.WebpPath)
		}
	}
	return paths
}

func collectMuralAssetPaths(assets []model.MuralAsset) []string {
	paths := make([]string, 0, len(assets))
	for _, asset := range assets {
		if asset.FilePath != "" {
			paths = append(paths, asset.FilePath)
		}
	}
	return paths
}

func normalizeOptionalText(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func setOptionalTextUpdate(updates map[string]interface{}, field string, value *string) {
	if value == nil {
		return
	}

	normalized := normalizeOptionalText(value)
	if normalized == nil {
		updates[field] = nil
		return
	}

	updates[field] = *normalized
}
