package handler

import (
	"bytes"
	"io"
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

	if err := h.db.Create(&img).Error; err != nil {
		response.ServerError(c)
		return
	}

	response.Created(c, img)
}
