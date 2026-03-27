package serializer

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
)

// AnnotationText 标注的文本序列化结构
type AnnotationText struct {
	ID          string
	DamageType  string
	Severity    int
	ImageLayer  string
	Coordinates domain.AnnotationCoordinates
	AreaPercent *float64
	Description *string
}

// roundCoord 将坐标值四舍五入到四位小数
func roundCoord(v float64) float64 {
	return math.Round(v*10000) / 10000
}

// FormatAnnotation 将标注数据格式化为可读文本
func FormatAnnotation(a *AnnotationText) string {
	var sb strings.Builder

	// 第一行：基本信息
	sb.WriteString(fmt.Sprintf("[%s] 病害类型:%s | 严重程度:%d | 图层:%s\n",
		a.ID, a.DamageType, a.Severity, a.ImageLayer))

	// 第二行：区域类型
	sb.WriteString(fmt.Sprintf("区域类型:%s\n", a.Coordinates.Type))

	// 第三行：坐标点（精度四位小数）
	points := make([]string, len(a.Coordinates.Points))
	for i, p := range a.Coordinates.Points {
		if len(p) >= 2 {
			points[i] = fmt.Sprintf("(%.4f,%.4f)", roundCoord(p[0]), roundCoord(p[1]))
		}
	}
	sb.WriteString(fmt.Sprintf("坐标点: %s\n", strings.Join(points, ", ")))

	// 第四行：面积占比
	if a.AreaPercent != nil {
		sb.WriteString(fmt.Sprintf("面积占比: %.2f%%\n", *a.AreaPercent))
	}

	// 第五行：描述
	if a.Description != nil && *a.Description != "" {
		sb.WriteString(fmt.Sprintf("描述: %s\n", *a.Description))
	}

	sb.WriteString("---")
	return sb.String()
}

// ParseAnnotation 将可读文本解析为标注数据
func ParseAnnotation(text string) (*AnnotationText, error) {
	text = strings.TrimSpace(text)
	text = strings.TrimSuffix(text, "---")
	text = strings.TrimSpace(text)

	lines := strings.Split(text, "\n")
	if len(lines) < 3 {
		return nil, fmt.Errorf("标注文本格式无效：至少需要 3 行")
	}

	a := &AnnotationText{}

	// 解析第一行：[ID] 病害类型:xxx | 严重程度:N | 图层:xxx
	line1 := strings.TrimSpace(lines[0])
	// 提取 ID
	idEnd := strings.Index(line1, "]")
	if !strings.HasPrefix(line1, "[") || idEnd < 0 {
		return nil, fmt.Errorf("第一行格式无效：缺少标注 ID")
	}
	a.ID = line1[1:idEnd]

	// 解析管道分隔的键值对
	rest := line1[idEnd+1:]
	parts := strings.Split(rest, "|")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if kv := strings.SplitN(part, ":", 2); len(kv) == 2 {
			key := strings.TrimSpace(kv[0])
			val := strings.TrimSpace(kv[1])
			switch key {
			case "病害类型":
				a.DamageType = val
			case "严重程度":
				s, err := strconv.Atoi(val)
				if err != nil {
					return nil, fmt.Errorf("严重程度解析失败: %w", err)
				}
				a.Severity = s
			case "图层":
				a.ImageLayer = val
			}
		}
	}

	// 解析剩余行
	for _, line := range lines[1:] {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "区域类型:") {
			a.Coordinates.Type = strings.TrimPrefix(line, "区域类型:")
		} else if strings.HasPrefix(line, "坐标点:") {
			pointsStr := strings.TrimPrefix(line, "坐标点:")
			pointsStr = strings.TrimSpace(pointsStr)
			a.Coordinates.Points = parsePoints(pointsStr)
		} else if strings.HasPrefix(line, "面积占比:") {
			pctStr := strings.TrimPrefix(line, "面积占比:")
			pctStr = strings.TrimSpace(pctStr)
			pctStr = strings.TrimSuffix(pctStr, "%")
			if f, err := strconv.ParseFloat(pctStr, 64); err == nil {
				a.AreaPercent = &f
			}
		} else if strings.HasPrefix(line, "描述:") {
			desc := strings.TrimSpace(strings.TrimPrefix(line, "描述:"))
			if desc != "" {
				a.Description = &desc
			}
		}
	}

	return a, nil
}

// parsePoints 解析坐标点字符串 "(0.1234,0.5678), (0.2345,0.6789)"
func parsePoints(s string) [][]float64 {
	var points [][]float64
	// 按 ), 分割
	parts := strings.Split(s, "),")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		part = strings.Trim(part, "()")
		coords := strings.Split(part, ",")
		if len(coords) >= 2 {
			x, err1 := strconv.ParseFloat(strings.TrimSpace(coords[0]), 64)
			y, err2 := strconv.ParseFloat(strings.TrimSpace(coords[1]), 64)
			if err1 == nil && err2 == nil {
				points = append(points, []float64{roundCoord(x), roundCoord(y)})
			}
		}
	}
	return points
}
