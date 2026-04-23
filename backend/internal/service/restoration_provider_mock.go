package service

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"

	"github.com/hry/beiqi-mural-guardian/backend/pkg/imaging"
)

type ServerMockRestorationProvider struct{}

func (ServerMockRestorationProvider) Name() string {
	return "server-mock"
}

func (p ServerMockRestorationProvider) GeneratePrimary(req GeneratePrimaryRequest) (*GeneratedImage, error) {
	return p.generate(req.SourceBytes, color.RGBA{R: 242, G: 226, B: 196, A: 44})
}

func (p ServerMockRestorationProvider) GenerateVariant(req GenerateVariantRequest) (*GeneratedImage, error) {
	source := req.BaseResultBytes
	if len(source) == 0 {
		source = req.SourceBytes
	}
	return p.generate(source, color.RGBA{R: 166, G: 94, B: 62, A: 38})
}

func (p ServerMockRestorationProvider) generate(source []byte, tint color.Color) (*GeneratedImage, error) {
	img, info, err := imaging.Decode(bytes.NewReader(source))
	if err != nil {
		return &GeneratedImage{
			Bytes:        append([]byte(nil), source...),
			Ext:          ".bin",
			FileSize:     int64(len(source)),
			IsMock:       true,
			ProviderName: p.Name(),
		}, nil
	}

	output := image.NewRGBA(img.Bounds())
	draw.Draw(output, output.Bounds(), img, img.Bounds().Min, draw.Src)
	draw.Draw(output, output.Bounds(), &image.Uniform{C: tint}, image.Point{}, draw.Over)

	var buf bytes.Buffer
	if err := imaging.EncodeOptimized(output, &buf); err != nil {
		return nil, err
	}

	return &GeneratedImage{
		Bytes:        buf.Bytes(),
		Ext:          ".png",
		Width:        info.Width,
		Height:       info.Height,
		FileSize:     int64(buf.Len()),
		IsMock:       true,
		ProviderName: p.Name(),
	}, nil
}
