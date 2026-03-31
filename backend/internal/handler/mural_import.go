package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"github.com/xuri/excelize/v2"
)

// BatchImport 批量导入壁画（Excel）
// Excel 格式：名称 | 年代 | 遗址 | 材质 | 墓室位置 | 尺寸 | 描述
func (h *MuralHandler) BatchImport(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传 Excel 文件")
		return
	}
	defer file.Close()

	f, err := excelize.OpenReader(file)
	if err != nil {
		response.BadRequest(c, "无法解析 Excel 文件")
		return
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		response.BadRequest(c, "读取工作表失败")
		return
	}

	if len(rows) < 2 {
		response.BadRequest(c, "Excel 文件无数据行（第一行为表头）")
		return
	}

	var (
		imported int
		errors   []string
	)

	// 跳过表头，从第二行开始
	for i, row := range rows[1:] {
		rowNum := i + 2
		if len(row) < 3 {
			errors = append(errors, fmt.Sprintf("第 %d 行：至少需要名称、年代、遗址三列", rowNum))
			continue
		}

		name := row[0]
		era := row[1]
		site := row[2]

		if name == "" || era == "" || site == "" {
			errors = append(errors, fmt.Sprintf("第 %d 行：名称、年代、遗址不能为空", rowNum))
			continue
		}

		mural := model.Mural{
			Name: name,
			Era:  era,
			Site: site,
		}

		if len(row) > 3 && row[3] != "" {
			mural.Material = row[3]
		}
		if len(row) > 4 && row[4] != "" {
			mural.TombLocation = &row[4]
		}
		if len(row) > 5 && row[5] != "" {
			mural.Dimensions = &row[5]
		}
		if len(row) > 6 && row[6] != "" {
			mural.Description = &row[6]
		}

		if err := h.svc.Create(&mural); err != nil {
			logger.L.Errorf("批量导入第 %d 行失败: %v", rowNum, err)
			errors = append(errors, fmt.Sprintf("第 %d 行：创建失败 - %s", rowNum, err.Error()))
			continue
		}
		imported++
	}

	response.OK(c, gin.H{
		"imported": imported,
		"total":    len(rows) - 1,
		"errors":   errors,
	})
}
