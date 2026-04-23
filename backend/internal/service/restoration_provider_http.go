package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
)

type HTTPRestorationProvider struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

func NewHTTPRestorationProvider(cfg *config.RestorationConfig) *HTTPRestorationProvider {
	timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
	if timeout <= 0 {
		timeout = 60 * time.Second
	}
	return &HTTPRestorationProvider{
		baseURL: strings.TrimRight(cfg.BaseURL, "/"),
		apiKey:  cfg.APIKey,
		client:  &http.Client{Timeout: timeout},
	}
}

func (p *HTTPRestorationProvider) Name() string {
	return "http"
}

func (p *HTTPRestorationProvider) GeneratePrimary(req GeneratePrimaryRequest) (*GeneratedImage, error) {
	fields := map[string]string{
		"parameters": string(defaultJSON(req.ParametersJSON, "{}")),
	}
	if len(req.AnnotationIDs) > 0 {
		raw, _ := json.Marshal(req.AnnotationIDs)
		fields["annotationIds"] = string(raw)
	}
	if req.ManualSelection != nil {
		raw, _ := json.Marshal(req.ManualSelection)
		fields["manualSelection"] = string(raw)
	}
	return p.postMultipart("/generate", []multipartFile{
		{name: "file", filename: "source", contentType: req.ContentType, data: req.SourceBytes},
	}, fields)
}

func (p *HTTPRestorationProvider) GenerateVariant(req GenerateVariantRequest) (*GeneratedImage, error) {
	return p.postMultipart("/variants", []multipartFile{
		{name: "source", filename: "source", data: req.SourceBytes},
		{name: "baseResult", filename: "base-result", data: req.BaseResultBytes},
	}, map[string]string{
		"parameters": string(defaultJSON(req.ParametersJSON, "{}")),
	})
}

type multipartFile struct {
	name        string
	filename    string
	contentType string
	data        []byte
}

func (p *HTTPRestorationProvider) postMultipart(endpoint string, files []multipartFile, fields map[string]string) (*GeneratedImage, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	for _, file := range files {
		part, err := writer.CreateFormFile(file.name, file.filename)
		if err != nil {
			return nil, err
		}
		if _, err := part.Write(file.data); err != nil {
			return nil, err
		}
	}
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			return nil, err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	request, err := http.NewRequest(http.MethodPost, p.baseURL+endpoint, &body)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if p.apiKey != "" {
		request.Header.Set("Authorization", "Bearer "+p.apiKey)
	}

	response, err := p.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	data, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("restoration provider returned %d: %s", response.StatusCode, strings.TrimSpace(string(data)))
	}

	width, height := decodeImageSize(data)
	return &GeneratedImage{
		Bytes:        data,
		Ext:          extFromContentType(response.Header.Get("Content-Type")),
		Width:        width,
		Height:       height,
		FileSize:     int64(len(data)),
		IsMock:       false,
		ProviderName: p.Name(),
	}, nil
}

func extFromContentType(contentType string) string {
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return ".bin"
	}
	switch mediaType {
	case "image/png":
		return ".png"
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	default:
		exts, err := mime.ExtensionsByType(mediaType)
		if err == nil && len(exts) > 0 {
			return exts[0]
		}
		return path.Ext(mediaType)
	}
}
