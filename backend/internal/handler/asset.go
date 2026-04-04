package handler

import (
	"bytes"
	"errors"
	"io"
	"mime"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/imaging"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/storage"
	"gorm.io/gorm"
)

const (
	maxModelAssetSize    = 100 << 20
	maxPanoramaAssetSize = 25 << 20
)

type AssetHandler struct {
	db      *gorm.DB
	storage *storage.LocalStorage
}

func NewAssetHandler(db *gorm.DB, store *storage.LocalStorage) *AssetHandler {
	return &AssetHandler{db: db, storage: store}
}

func (h *AssetHandler) Upload(c *gin.Context) {
	muralID := c.Param("id")
	changedBy := resolveChangedBy(c, h.db)

	var mural model.Mural
	if err := h.db.First(&mural, "id = ?", muralID).Error; err != nil {
		response.NotFound(c, "澹佺敾")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "璇蜂笂浼犺祫婧愭枃浠?")
		return
	}
	defer file.Close()

	assetType := model.AssetType(c.PostForm("assetType"))
	if !assetType.IsValid() {
		response.BadRequest(c, "鏃犳晥鐨勮祫婧愮被鍨?")
		return
	}

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		response.ServerError(c)
		return
	}
	data := buf.Bytes()
	if len(data) == 0 {
		response.BadRequest(c, "鏂囦欢鍐呭涓嶈兘涓虹┖")
		return
	}

	if err := validateAssetFile(assetType, header.Filename, len(data)); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	fileHash, err := hash.FileSHA256(bytes.NewReader(data))
	if err != nil {
		response.ServerError(c)
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	filename := fileHash + ext
	subDir := filepath.ToSlash(filepath.Join("murals", muralID, "assets", string(assetType)))
	relPath, err := h.storage.Save(subDir, filename, bytes.NewReader(data))
	if err != nil {
		response.ServerError(c)
		return
	}

	assetName := strings.TrimSpace(c.PostForm("name"))
	if assetName == "" {
		assetName = strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = mime.TypeByExtension(ext)
	}
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	asset := model.MuralAsset{
		MuralID:   muralID,
		AssetType: assetType,
		Name:      assetName,
		FilePath:  relPath,
		FileHash:  fileHash,
		MimeType:  mimeType,
		FileSize:  int64(len(data)),
		CreatedAt: time.Now(),
	}

	if assetType == model.AssetPanorama {
		if _, info, decErr := imaging.Decode(bytes.NewReader(data)); decErr == nil {
			asset.Width = info.Width
			asset.Height = info.Height
		}
	}

	makeDefault := c.PostForm("makeDefault") == "true"
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		var previousDefault model.MuralAsset
		hasPreviousDefault := false

		var maxVersion int
		if err := tx.Model(&model.MuralAsset{}).
			Where("mural_id = ? AND asset_type = ?", muralID, assetType).
			Select("COALESCE(MAX(version), 0)").
			Scan(&maxVersion).Error; err != nil {
			return err
		}
		asset.Version = maxVersion + 1

		var defaultCount int64
		if err := tx.Model(&model.MuralAsset{}).
			Where("mural_id = ? AND asset_type = ? AND is_default = ?", muralID, assetType, true).
			Count(&defaultCount).Error; err != nil {
			return err
		}
		if defaultCount > 0 {
			if err := tx.Where("mural_id = ? AND asset_type = ? AND is_default = ?", muralID, assetType, true).
				First(&previousDefault).Error; err == nil {
				hasPreviousDefault = true
			}
		}
		asset.IsDefault = makeDefault || defaultCount == 0
		if asset.IsDefault {
			if err := tx.Model(&model.MuralAsset{}).
				Where("mural_id = ? AND asset_type = ?", muralID, assetType).
				Update("is_default", false).Error; err != nil {
				return err
			}
		}

		if err := tx.Create(&asset).Error; err != nil {
			return err
		}

		if err := createMuralHistoryEntry(
			tx,
			muralID,
			"asset."+string(assetType),
			nil,
			historyString(formatAssetHistoryValue(asset)),
			changedBy,
		); err != nil {
			return err
		}

		if asset.IsDefault {
			var oldValue *string
			if hasPreviousDefault {
				oldValue = historyString(formatAssetHistoryValue(previousDefault))
			}
			if err := createMuralHistoryEntry(
				tx,
				muralID,
				"asset."+string(assetType)+".default",
				oldValue,
				historyString(formatAssetHistoryValue(asset)),
				changedBy,
			); err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		_ = h.storage.Delete(relPath)
		response.ServerError(c)
		return
	}

	response.Created(c, asset)
}

func (h *AssetHandler) Delete(c *gin.Context) {
	muralID := c.Param("id")
	assetID := c.Param("assetId")
	changedBy := resolveChangedBy(c, h.db)

	var asset model.MuralAsset
	if err := h.db.First(&asset, "id = ? AND mural_id = ?", assetID, muralID).Error; err != nil {
		response.NotFound(c, "璧勪骇")
		return
	}

	if err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.MuralAsset{}, "id = ?", assetID).Error; err != nil {
			return err
		}

		if err := createMuralHistoryEntry(
			tx,
			muralID,
			"asset."+string(asset.AssetType),
			historyString(formatAssetHistoryValue(asset)),
			nil,
			changedBy,
		); err != nil {
			return err
		}
		if !asset.IsDefault {
			return nil
		}

		var next model.MuralAsset
		err := tx.Where("mural_id = ? AND asset_type = ?", muralID, asset.AssetType).
			Order("created_at DESC").
			First(&next).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		if err := tx.Model(&next).Update("is_default", true).Error; err != nil {
			return err
		}
		next.IsDefault = true
		return createMuralHistoryEntry(
			tx,
			muralID,
			"asset."+string(asset.AssetType)+".default",
			historyString(formatAssetHistoryValue(asset)),
			historyString(formatAssetHistoryValue(next)),
			changedBy,
		)
	}); err != nil {
		response.ServerError(c)
		return
	}

	if err := h.storage.Delete(asset.FilePath); err != nil {
		logger.L.Warnf("鍒犻櫎澹佺敾璧勪骇鏂囦欢澶辫触 %s: %v", asset.FilePath, err)
	}
	if err := h.storage.DeleteDirIfEmpty(path.Dir(asset.FilePath)); err != nil {
		logger.L.Warnf("鍒犻櫎澹佺敾璧勪骇鐩綍澶辫触 %s: %v", asset.FilePath, err)
	}

	response.OK(c, gin.H{"message": "鍒犻櫎鎴愬姛"})
}

func (h *AssetHandler) SetDefault(c *gin.Context) {
	muralID := c.Param("id")
	assetID := c.Param("assetId")
	changedBy := resolveChangedBy(c, h.db)

	var asset model.MuralAsset
	if err := h.db.First(&asset, "id = ? AND mural_id = ?", assetID, muralID).Error; err != nil {
		response.NotFound(c, "璧勪骇")
		return
	}

	if err := h.db.Transaction(func(tx *gorm.DB) error {
		var previousDefault model.MuralAsset
		hasPreviousDefault := false
		if err := tx.Where("mural_id = ? AND asset_type = ? AND is_default = ?", muralID, asset.AssetType, true).
			First(&previousDefault).Error; err == nil {
			hasPreviousDefault = previousDefault.ID != asset.ID
		}

		if err := tx.Model(&model.MuralAsset{}).
			Where("mural_id = ? AND asset_type = ?", muralID, asset.AssetType).
			Update("is_default", false).Error; err != nil {
			return err
		}
		if err := tx.Model(&model.MuralAsset{}).Where("id = ?", assetID).Update("is_default", true).Error; err != nil {
			return err
		}

		var oldValue *string
		if hasPreviousDefault {
			oldValue = historyString(formatAssetHistoryValue(previousDefault))
		}
		return createMuralHistoryEntry(
			tx,
			muralID,
			"asset."+string(asset.AssetType)+".default",
			oldValue,
			historyString(formatAssetHistoryValue(model.MuralAsset{
				ID:        asset.ID,
				MuralID:   asset.MuralID,
				AssetType: asset.AssetType,
				Name:      asset.Name,
				FilePath:  asset.FilePath,
				FileHash:  asset.FileHash,
				MimeType:  asset.MimeType,
				FileSize:  asset.FileSize,
				Width:     asset.Width,
				Height:    asset.Height,
				Version:   asset.Version,
				IsDefault: true,
				CreatedAt: asset.CreatedAt,
			})),
			changedBy,
		)
	}); err != nil {
		response.ServerError(c)
		return
	}

	asset.IsDefault = true
	response.OK(c, asset)
}

func validateAssetFile(assetType model.AssetType, filename string, fileSize int) error {
	ext := strings.ToLower(filepath.Ext(filename))

	switch assetType {
	case model.AssetModel:
		if ext != ".glb" {
			return errors.New("3D妯″瀷鏆傚彧鏀寔 .glb 鏂囦欢")
		}
		if fileSize > maxModelAssetSize {
			return errors.New("3D妯″瀷鏂囦欢涓嶈兘瓒呰繃 100MB")
		}
	case model.AssetPanorama:
		switch ext {
		case ".jpg", ".jpeg", ".png", ".webp":
		default:
			return errors.New("鍏ㄦ櫙鍥炬殏鍙敮鎸?jpg/jpeg/png/webp")
		}
		if fileSize > maxPanoramaAssetSize {
			return errors.New("鍏ㄦ櫙鍥炬枃浠朵笉鑳借秴杩?25MB")
		}
	default:
		return errors.New("鏃犳晥鐨勮祫婧愮被鍨?")
	}

	return nil
}
