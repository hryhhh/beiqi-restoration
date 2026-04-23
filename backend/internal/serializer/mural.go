package serializer

import (
	"encoding/json"
	"fmt"
	"time"
)

// MuralJSON 壁画记录的 JSON 序列化结构
type MuralJSON struct {
	ID                   string     `json:"id"`
	Name                 string     `json:"name"`
	Era                  string     `json:"era"`
	Site                 string     `json:"site"`
	Material             string     `json:"material"`
	TombLocation         *string    `json:"tombLocation"`
	ExcavationDate       *time.Time `json:"excavationDate"`
	Dimensions           *string    `json:"dimensions"`
	Description          *string    `json:"description"`
	PopularIntroduction  *string    `json:"popularIntroduction"`
	HistoricalBackground *string    `json:"historicalBackground"`
	ArtisticFeatures     *string    `json:"artisticFeatures"`
	CulturalSignificance *string    `json:"culturalSignificance"`
	Status               string     `json:"status"`
	HealthIndex          *float64   `json:"healthIndex"`
	IsFeatured           bool       `json:"isFeatured"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

// SerializeMural 将壁画记录序列化为 JSON 字符串
func SerializeMural(m *MuralJSON) (string, error) {
	data, err := json.Marshal(m)
	if err != nil {
		return "", fmt.Errorf("序列化壁画记录失败: %w", err)
	}
	return string(data), nil
}

// DeserializeMural 将 JSON 字符串反序列化为壁画记录
func DeserializeMural(data string) (*MuralJSON, error) {
	var m MuralJSON
	if err := json.Unmarshal([]byte(data), &m); err != nil {
		return nil, fmt.Errorf("反序列化壁画记录失败: %w", err)
	}
	return &m, nil
}

// ValidationError 校验错误，包含具体字段信息
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationErrors 多个校验错误
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

func (e *ValidationErrors) Error() string {
	if len(e.Errors) == 0 {
		return "校验通过"
	}
	return fmt.Sprintf("校验失败: %d 个字段不合规", len(e.Errors))
}

// ValidateMuralJSON 校验壁画 JSON 数据，返回具体字段错误
func ValidateMuralJSON(data string) *ValidationErrors {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(data), &raw); err != nil {
		return &ValidationErrors{Errors: []ValidationError{
			{Field: "_json", Message: "JSON 格式无效: " + err.Error()},
		}}
	}

	var errs []ValidationError

	// 必填字段校验
	required := map[string]string{
		"name":     "名称",
		"era":      "年代",
		"site":     "出土地点",
		"material": "材质",
	}
	for field, label := range required {
		v, ok := raw[field]
		if !ok || v == nil {
			errs = append(errs, ValidationError{Field: field, Message: label + "不能为空"})
			continue
		}
		s, ok := v.(string)
		if !ok || s == "" {
			errs = append(errs, ValidationError{Field: field, Message: label + "不能为空"})
		}
	}

	// 状态枚举校验
	if v, ok := raw["status"]; ok && v != nil {
		s, _ := v.(string)
		validStatuses := map[string]bool{
			"registered": true, "assessing": true, "restoring": true,
			"completed": true, "monitoring": true, "": true,
		}
		if !validStatuses[s] {
			errs = append(errs, ValidationError{Field: "status", Message: "无效的壁画状态: " + s})
		}
	}

	// 健康指数范围校验
	if v, ok := raw["healthIndex"]; ok && v != nil {
		f, ok := v.(float64)
		if !ok {
			errs = append(errs, ValidationError{Field: "healthIndex", Message: "健康指数必须为数字"})
		} else if f < 0 || f > 100 {
			errs = append(errs, ValidationError{Field: "healthIndex", Message: "健康指数必须在 0-100 之间"})
		}
	}

	if len(errs) == 0 {
		return nil
	}
	return &ValidationErrors{Errors: errs}
}
