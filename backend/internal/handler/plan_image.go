package handler

import (
	"bytes"
	"io"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
)

// UploadImage 上传修复前/后图像
// type 参数：before 或 after
func (h *PlanHandler) UploadImage(c *gin.Context) {
	planID := c.Param("id")

	var plan model.RestorationPlan
	if err := h.db.First(&plan, "id = ?", planID).Error; err != nil {
		response.NotFound(c, "修复方案")
		return
	}

	imgType := c.DefaultPostForm("type", "after") // before 或 after
	if imgType != "before" && imgType != "after" {
		response.BadRequest(c, "type 参数必须为 before 或 after")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传图像文件")
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		response.ServerError(c)
		return
	}

	fileHash, _ := hash.FileSHA256(bytes.NewReader(buf.Bytes()))
	ext := filepath.Ext(header.Filename)
	filename := fileHash + ext
	subDir := "plans/" + planID

	relPath, err := h.store.Save(subDir, filename, bytes.NewReader(buf.Bytes()))
	if err != nil {
		response.ServerError(c)
		return
	}

	if imgType == "before" {
		plan.BeforeImage = &relPath
	} else {
		plan.AfterImage = &relPath
		plan.AfterVersion++
	}
	h.db.Save(&plan)

	response.OK(c, plan)
}
