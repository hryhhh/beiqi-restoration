package handler

import (
	"bytes"
	"errors"
	"io"
	"path"
	"path/filepath"
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

type ImageHandler struct {
	db      *gorm.DB
	storage *storage.LocalStorage
}

func NewImageHandler(db *gorm.DB, store *storage.LocalStorage) *ImageHandler {
	return &ImageHandler{db: db, storage: store}
}

// Upload 上传壁画图像，自动生成缩略图并记录尺寸
func (h *ImageHandler) Upload(c *gin.Context) {
	muralID := c.Param("id")
	changedBy := resolveChangedBy(c, h.db)

	// 验证壁画存在
	var mural model.Mural
	if err := h.db.First(&mural, "id = ?", muralID).Error; err != nil {
		response.NotFound(c, "壁画")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传图像文件")
		return
	}
	defer file.Close()

	imageType := model.ImageType(c.DefaultPostForm("imageType", "visible"))

	// 读取文件内容
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		response.ServerError(c)
		return
	}
	data := buf.Bytes()

	// 计算哈希
	fileHash, err := hash.FileSHA256(bytes.NewReader(data))
	if err != nil {
		response.ServerError(c)
		return
	}

	// 保存原图
	ext := filepath.Ext(header.Filename)
	filename := fileHash + ext
	subDir := "murals/" + muralID
	relPath, err := h.storage.Save(subDir, filename, bytes.NewReader(data))
	if err != nil {
		response.ServerError(c)
		return
	}

	img := model.MuralImage{
		MuralID:   muralID,
		FilePath:  relPath,
		FileHash:  fileHash,
		ImageType: imageType,
		FileSize:  int64(len(data)),
		CreatedAt: time.Now(),
	}

	// 解码图像获取尺寸 + 生成缩略图
	decoded, info, decErr := imaging.Decode(bytes.NewReader(data))
	if decErr == nil {
		img.Width = info.Width
		img.Height = info.Height

		thumbPath, thumbErr := imaging.Thumbnail(decoded, h.storage.BaseDir(), subDir, filename)
		if thumbErr == nil {
			img.ThumbnailPath = &thumbPath
		} else {
			logger.L.Warnf("缩略图生成失败: %v", thumbErr)
		}
	} else {
		logger.L.Warnf("图像解码失败，跳过缩略图: %v", decErr)
	}

	if err := h.db.Transaction(func(tx *gorm.DB) error {
		var maxVersion int
		if err := tx.Model(&model.MuralImage{}).
			Where("mural_id = ? AND image_type = ?", muralID, imageType).
			Select("COALESCE(MAX(version), 0)").
			Scan(&maxVersion).Error; err != nil {
			return err
		}
		img.Version = maxVersion + 1

		if err := tx.Create(&img).Error; err != nil {
			return err
		}

		return createMuralHistoryEntry(
			tx,
			muralID,
			"image."+string(imageType),
			nil,
			historyString(formatImageHistoryValue(img)),
			changedBy,
		)
	}); err != nil {
		response.ServerError(c)
		return
	}

	response.Created(c, img)
}

// Delete 删除壁画图像；若该图层仅剩最后一张图且已有标注，则拒绝删除
func (h *ImageHandler) Delete(c *gin.Context) {
	muralID := c.Param("id")
	imageID := c.Param("imageId")
	changedBy := resolveChangedBy(c, h.db)
	var errLayerHasAnnotations = errors.New("layer_has_annotations")

	var img model.MuralImage
	if err := h.db.First(&img, "id = ? AND mural_id = ?", imageID, muralID).Error; err != nil {
		response.NotFound(c, "图像")
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		var sameLayerCount int64
		if err := tx.Model(&model.MuralImage{}).
			Where("mural_id = ? AND image_type = ?", muralID, img.ImageType).
			Count(&sameLayerCount).Error; err != nil {
			return err
		}

		if sameLayerCount <= 1 {
			var annotationCount int64
			if err := tx.Model(&model.DamageAnnotation{}).
				Where("mural_id = ? AND image_layer = ?", muralID, img.ImageType).
				Count(&annotationCount).Error; err != nil {
				return err
			}
			if annotationCount > 0 {
				return errLayerHasAnnotations
			}
		}

		if err := tx.Delete(&model.MuralImage{}, "id = ?", imageID).Error; err != nil {
			return err
		}

		return createMuralHistoryEntry(
			tx,
			muralID,
			"image."+string(img.ImageType),
			historyString(formatImageHistoryValue(img)),
			nil,
			changedBy,
		)
	})
	if err != nil {
		if errors.Is(err, errLayerHasAnnotations) {
			response.Conflict(c, "当前图层仍有关联病害标注，请先删除或转移标注后再删除最后一张图像")
			return
		}
		response.ServerError(c)
		return
	}

	for _, relPath := range []string{
		img.FilePath,
		derefString(img.ThumbnailPath),
		derefString(img.WebpPath),
	} {
		if err := h.storage.Delete(relPath); err != nil {
			logger.L.Warnf("删除图像文件失败 %s: %v", relPath, err)
		}
	}
	if err := h.storage.DeleteDirIfEmpty(path.Dir(img.FilePath)); err != nil {
		logger.L.Warnf("删除图像目录失败 %s: %v", img.FilePath, err)
	}

	response.OK(c, gin.H{"message": "删除成功"})
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
