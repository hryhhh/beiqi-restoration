package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: northern-qi-mural-restoration, Property 11: 壁画记录创建与校验
// Validates: Requirements 3.1, 3.6
func TestProperty11_MuralCreateValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("缺少必填字段应返回 400", prop.ForAll(
		func(fieldToRemove string) bool {
			body := map[string]string{
				"name": "测试壁画", "era": "北齐", "site": "太原", "material": "石灰",
			}
			delete(body, fieldToRemove)
			data, _ := json.Marshal(body)

			r := gin.New()
			h := &MuralHandler{svc: nil}
			r.POST("/api/murals", h.Create)

			req := httptest.NewRequest("POST", "/api/murals", bytes.NewReader(data))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			return w.Code == http.StatusBadRequest
		},
		gen.OneConstOf("name", "era", "site", "material"),
	))

	properties.TestingRun(t)
}

// Feature: northern-qi-mural-restoration, Property 14: 图像上传 hash 一致性
// Validates: Requirements 3.2
func TestProperty14_ImageHashConsistency(t *testing.T) {
	properties := gopter.NewProperties(gopter.DefaultTestParameters())

	properties.Property("相同内容应产生相同的 SHA-256 哈希", prop.ForAll(
		func(content string) bool {
			if content == "" {
				return true
			}
			h1, _ := hash.FileSHA256(readerFrom(content))
			h2, _ := hash.FileSHA256(readerFrom(content))
			return h1 == h2
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.Property("不同内容应产生不同的哈希", prop.ForAll(
		func(a, b string) bool {
			if a == b || a == "" || b == "" {
				return true
			}
			h1, _ := hash.FileSHA256(readerFrom(a))
			h2, _ := hash.FileSHA256(readerFrom(b))
			return h1 != h2
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.TestingRun(t)
}

func TestNormalizeOptionalText(t *testing.T) {
	blank := "   "
	if got := normalizeOptionalText(&blank); got != nil {
		t.Fatalf("expected blank input to normalize to nil, got %v", *got)
	}

	text := "  北齐墓室壁画  "
	got := normalizeOptionalText(&text)
	if got == nil {
		t.Fatal("expected non-blank input to remain non-nil")
	}
	if *got != "北齐墓室壁画" {
		t.Fatalf("expected trimmed text, got %q", *got)
	}
}

func readerFrom(s string) io.Reader {
	return bytes.NewReader([]byte(s))
}
