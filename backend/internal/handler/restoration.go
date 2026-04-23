package handler

import (
	"encoding/json"
	"errors"
	"io"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type RestorationHandler struct {
	service *service.RestorationService
}

func NewRestorationHandler(svc *service.RestorationService) *RestorationHandler {
	return &RestorationHandler{service: svc}
}

type createRestorationRunPayload struct {
	MuralID         string                        `json:"muralId"`
	Mode            model.RestorationMode         `json:"mode"`
	Parameters      json.RawMessage               `json:"parameters"`
	AnnotationIDs   []string                      `json:"annotationIds"`
	ManualSelection *domain.AnnotationCoordinates `json:"manualSelection"`
}

func (h *RestorationHandler) CreateRun(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传原图文件")
		return
	}
	defer file.Close()

	payloadText := c.PostForm("payload")
	if payloadText == "" {
		response.BadRequest(c, "缺少 payload")
		return
	}

	var payload createRestorationRunPayload
	if err := json.Unmarshal([]byte(payloadText), &payload); err != nil {
		response.BadRequest(c, "payload JSON 无效")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		response.ServerError(c)
		return
	}

	detail, err := h.service.CreateRun(service.CreateRunRequest{
		Input: service.GenerateRunInput{
			MuralID:         payload.MuralID,
			Mode:            payload.Mode,
			HasSourceFile:   len(fileBytes) > 0,
			AnnotationIDs:   payload.AnnotationIDs,
			ManualSelection: payload.ManualSelection,
		},
		FileName:       header.Filename,
		ContentType:    header.Header.Get("Content-Type"),
		FileBytes:      fileBytes,
		ParametersJSON: payload.Parameters,
		ChangedBy:      currentUserID(c),
	})
	if err != nil {
		writeRestorationError(c, err)
		return
	}
	response.Created(c, detail)
}

func (h *RestorationHandler) ListRuns(c *gin.Context) {
	limit := 20
	if raw := c.Query("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			response.BadRequest(c, "limit 参数无效")
			return
		}
		limit = parsed
	}

	runs, err := h.service.ListRuns(c.Query("muralId"), limit)
	if err != nil {
		writeRestorationError(c, err)
		return
	}
	response.OK(c, runs)
}

func (h *RestorationHandler) GetRun(c *gin.Context) {
	detail, err := h.service.GetRunDetail(c.Param("id"))
	if err != nil {
		writeRestorationError(c, err)
		return
	}
	response.OK(c, detail)
}

func (h *RestorationHandler) CreateVariant(c *gin.Context) {
	var req struct {
		BaseResultID string `json:"baseResultId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	detail, err := h.service.CreateVariant(c.Param("id"), req.BaseResultID, currentUserID(c))
	if err != nil {
		writeRestorationError(c, err)
		return
	}
	response.Created(c, detail)
}

func (h *RestorationHandler) CommitResult(c *gin.Context) {
	result, err := h.service.CommitResult(c.Param("id"), currentUserID(c))
	if err != nil {
		writeRestorationError(c, err)
		return
	}
	response.OK(c, result)
}

func writeRestorationError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrMissingMuralID):
		response.BadRequest(c, "缺少壁画 ID")
	case errors.Is(err, service.ErrMissingSourceFile):
		response.BadRequest(c, "缺少原图文件")
	case errors.Is(err, service.ErrPartialNeedsSelection):
		response.BadRequest(c, "局部精修需要选择标注或手工选区")
	case errors.Is(err, service.ErrResultAlreadyCommitted):
		response.Conflict(c, "该修复结果已经保存为修复后图像")
	case errors.Is(err, gorm.ErrRecordNotFound):
		response.NotFound(c, "修复记录")
	default:
		response.ServerError(c)
	}
}

func currentUserID(c *gin.Context) string {
	value, exists := c.Get("userId")
	if !exists {
		return "system"
	}
	userID, ok := value.(string)
	if !ok || userID == "" {
		return "system"
	}
	return userID
}
