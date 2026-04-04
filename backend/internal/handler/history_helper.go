package handler

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"gorm.io/gorm"
)

func resolveChangedBy(c *gin.Context, db *gorm.DB) string {
	userIDValue, exists := c.Get("userId")
	if !exists {
		return "system"
	}

	userID, ok := userIDValue.(string)
	if !ok || strings.TrimSpace(userID) == "" {
		return "system"
	}

	var user model.User
	if err := db.Select("username").First(&user, "id = ?", userID).Error; err == nil && user.Username != "" {
		return user.Username
	}

	return userID
}

func createMuralHistoryEntry(tx *gorm.DB, muralID, field string, oldValue, newValue *string, changedBy string) error {
	entry := &model.MuralHistory{
		MuralID:   muralID,
		Field:     field,
		OldValue:  oldValue,
		NewValue:  newValue,
		ChangedBy: changedBy,
	}
	return tx.Create(entry).Error
}

func historyString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func formatImageHistoryValue(img model.MuralImage) string {
	parts := []string{
		fmt.Sprintf("图层 %s", imageTypeLabel(img.ImageType)),
		fmt.Sprintf("版本 v%d", img.Version),
	}
	if img.Width > 0 && img.Height > 0 {
		parts = append(parts, fmt.Sprintf("%dx%d", img.Width, img.Height))
	}
	if img.FileSize > 0 {
		parts = append(parts, formatFileSize(img.FileSize))
	}
	return strings.Join(parts, " · ")
}

func formatAssetHistoryValue(asset model.MuralAsset) string {
	parts := []string{
		fmt.Sprintf("%s资源 %s", assetTypeLabel(asset.AssetType), asset.Name),
		fmt.Sprintf("版本 v%d", asset.Version),
	}
	if asset.Width > 0 && asset.Height > 0 {
		parts = append(parts, fmt.Sprintf("%dx%d", asset.Width, asset.Height))
	}
	if asset.FileSize > 0 {
		parts = append(parts, formatFileSize(asset.FileSize))
	}
	if asset.IsDefault {
		parts = append(parts, "默认")
	}
	return strings.Join(parts, " · ")
}

func formatAnnotationHistoryValue(annotation model.DamageAnnotation) string {
	parts := []string{
		fmt.Sprintf("图层 %s", imageTypeLabel(annotation.ImageLayer)),
		fmt.Sprintf("病害 %s", damageTypeLabel(annotation.DamageType)),
		fmt.Sprintf("严重度 %d", annotation.Severity),
		fmt.Sprintf("版本 v%d", annotation.Version),
	}

	if geometry := annotationGeometrySummary(annotation.Coordinates); geometry != "" {
		parts = append(parts, geometry)
	}

	if description := strings.TrimSpace(derefString(annotation.Description)); description != "" {
		parts = append(parts, fmt.Sprintf("说明 %s", description))
	}

	return strings.Join(parts, " · ")
}

func annotationGeometrySummary(raw []byte) string {
	var coords domain.AnnotationCoordinates
	if err := json.Unmarshal(raw, &coords); err != nil {
		return ""
	}

	switch coords.Type {
	case "rect":
		return "形状 矩形"
	case "polygon":
		return fmt.Sprintf("形状 多边形(%d点)", len(coords.Points))
	case "path":
		return fmt.Sprintf("形状 路径(%d点)", len(coords.Points))
	default:
		return ""
	}
}

func formatFileSize(size int64) string {
	if size >= 1<<20 {
		return fmt.Sprintf("%.1f MB", float64(size)/(1<<20))
	}
	if size >= 1<<10 {
		return fmt.Sprintf("%d KB", size>>10)
	}
	return fmt.Sprintf("%d B", size)
}

func imageTypeLabel(imageType model.ImageType) string {
	switch imageType {
	case model.ImageVisible:
		return "可见光"
	case model.ImageInfrared:
		return "红外"
	case model.ImageUltraviolet:
		return "紫外"
	case model.ImageRestored:
		return "修复后"
	default:
		return string(imageType)
	}
}

func assetTypeLabel(assetType model.AssetType) string {
	switch assetType {
	case model.AssetModel:
		return "3D"
	case model.AssetPanorama:
		return "全景"
	default:
		return string(assetType)
	}
}

func damageTypeLabel(damageType model.DamageType) string {
	switch damageType {
	case model.DamageDetachment:
		return "空鼓"
	case model.DamageFlaking:
		return "起甲"
	case model.DamageSaltEfflorescence:
		return "盐碱"
	case model.DamageCracking:
		return "龟裂/裂缝"
	case model.DamagePigmentLoss:
		return "颜料层脱落"
	case model.DamageFading:
		return "褪色/变色"
	case model.DamageSoiling:
		return "表面污渍"
	case model.DamageMold:
		return "霉斑/菌害"
	case model.DamageInsect:
		return "虫害/动物损伤"
	case model.DamageRoot:
		return "植物根系破坏"
	default:
		return string(damageType)
	}
}
