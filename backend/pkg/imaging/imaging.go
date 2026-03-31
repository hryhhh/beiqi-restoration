package imaging

import (
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"os"
	"path/filepath"
	"strings"

	// 注册常见图像格式解码器
	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"
)

const thumbnailMaxDim = 300

// Info 图像基本信息
type Info struct {
	Width  int
	Height int
}

// Decode 解码图像并返回尺寸信息
func Decode(r io.Reader) (image.Image, *Info, error) {
	img, _, err := image.Decode(r)
	if err != nil {
		return nil, nil, err
	}
	bounds := img.Bounds()
	return img, &Info{Width: bounds.Dx(), Height: bounds.Dy()}, nil
}

// Thumbnail 生成缩略图，保持宽高比，最长边不超过 thumbnailMaxDim
// 返回缩略图相对路径
func Thumbnail(img image.Image, baseDir, subDir, baseName string) (string, error) {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	// 计算缩放比例
	ratio := 1.0
	if w > h && w > thumbnailMaxDim {
		ratio = float64(thumbnailMaxDim) / float64(w)
	} else if h >= w && h > thumbnailMaxDim {
		ratio = float64(thumbnailMaxDim) / float64(h)
	}

	newW := int(float64(w) * ratio)
	newH := int(float64(h) * ratio)

	// 最近邻缩放（简单高效）
	thumb := image.NewRGBA(image.Rect(0, 0, newW, newH))
	for y := 0; y < newH; y++ {
		for x := 0; x < newW; x++ {
			srcX := x * w / newW
			srcY := y * h / newH
			thumb.Set(x, y, img.At(bounds.Min.X+srcX, bounds.Min.Y+srcY))
		}
	}

	// 保存缩略图
	dir := filepath.Join(baseDir, subDir)
	os.MkdirAll(dir, 0755)

	thumbName := strings.TrimSuffix(baseName, filepath.Ext(baseName)) + "_thumb.jpg"
	relPath := filepath.Join(subDir, thumbName)
	fullPath := filepath.Join(baseDir, relPath)

	f, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	// 缩略图统一用 JPEG，质量 80
	if err := jpeg.Encode(f, thumb, &jpeg.Options{Quality: 80}); err != nil {
		return "", err
	}
	return relPath, nil
}

// EncodeOptimized 将图像编码为优化格式（PNG）
// 用于需要无损压缩的场景
func EncodeOptimized(img image.Image, w io.Writer) error {
	return png.Encode(w, img)
}
