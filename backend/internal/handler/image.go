package handler

import (
	"bytes"
	"io"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
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

// Upload 上传壁画图像
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

	// 读取文件内容计算哈希
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		response.ServerError(c)
		return
	}

	fileHash, err := hash.FileSHA256(bytes.NewReader(buf.Bytes()))
	if err != nil {
		response.ServerError(c)
		return
	}

	// 保存文件
	ext := filepath.Ext(header.Filename)
	filename := fileHash + ext
	relPath, err := h.storage.Save("murals/"+muralID, filename, bytes.NewReader(buf.Bytes()))
	if err != nil {
		response.ServerError(c)
		return
	}

	img := model.MuralImage{
		MuralID:   muralID,
		FilePath:  relPath,
		FileHash:  fileHash,
		ImageType: imageType,
		FileSize:  int64(buf.Len()),
		CreatedAt: time.Now(),
	}
	if err := h.db.Create(&img).Error; err != nil {
		response.ServerError(c)
		return
	}

	response.Created(c, img)
}
