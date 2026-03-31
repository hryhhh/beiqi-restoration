package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/middleware"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	pkgjwt "github.com/hry/beiqi-mural-guardian/backend/pkg/jwt"
)

func TestAuthMe(t *testing.T) {
	gin.SetMode(gin.TestMode)
	jm := pkgjwt.NewManager("test-secret", 24)

	h := &AuthHandler{jm: jm}
	h.findUserByID = func(id string) (*model.User, error) {
		if id != "user-1" {
			return nil, errors.New("not found")
		}
		return &model.User{
			ID:        "user-1",
			Username:  "tester",
			Email:     "tester@example.com",
			Role:      model.RoleResearcher,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}, nil
	}

	r := gin.New()
	api := r.Group("/api")
	api.Use(middleware.JWTAuth(jm))
	api.GET("/auth/me", h.Me)

	t.Run("valid token should return current user", func(t *testing.T) {
		token, err := jm.Generate("user-1", string(model.RoleResearcher))
		if err != nil {
			t.Fatalf("generate token failed: %v", err)
		}

		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp struct {
			Code int `json:"code"`
			Data struct {
				ID       string `json:"id"`
				Username string `json:"username"`
				Email    string `json:"email"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response failed: %v", err)
		}
		if resp.Code != 0 {
			t.Fatalf("expected code 0, got %d", resp.Code)
		}
		if resp.Data.ID != "user-1" {
			t.Fatalf("expected id user-1, got %s", resp.Data.ID)
		}
	})

	t.Run("missing token should return 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("invalid token should return 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})
}

func TestConfirmResetPasswordCompatFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	setupHandler := func() (*AuthHandler, *bool) {
		called := false
		h := &AuthHandler{}
		h.findResetTokenByID = func(token string) (*model.PasswordResetToken, error) {
			if token != "reset-token" {
				return nil, errors.New("not found")
			}
			return &model.PasswordResetToken{
				UserID:    "user-1",
				Token:     token,
				Used:      false,
				ExpiresAt: time.Now().Add(30 * time.Minute),
			}, nil
		}
		h.applyPasswordReset = func(resetToken *model.PasswordResetToken, hashedPassword string) error {
			called = true
			if hashedPassword == "" {
				return errors.New("empty password")
			}
			return nil
		}
		return h, &called
	}

	run := func(body map[string]string, handler *AuthHandler) *httptest.ResponseRecorder {
		r := gin.New()
		r.POST("/api/auth/reset-password/confirm", handler.ConfirmResetPassword)
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password/confirm", bytes.NewReader(data))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}

	t.Run("accepts newPassword field", func(t *testing.T) {
		h, called := setupHandler()
		w := run(map[string]string{
			"token":       "reset-token",
			"newPassword": "newpass123",
		}, h)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !*called {
			t.Fatal("expected applyPasswordReset to be called")
		}
	})

	t.Run("accepts legacy password field", func(t *testing.T) {
		h, called := setupHandler()
		w := run(map[string]string{
			"token":    "reset-token",
			"password": "legacy123",
		}, h)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !*called {
			t.Fatal("expected applyPasswordReset to be called")
		}
	})

	t.Run("rejects short password", func(t *testing.T) {
		h, called := setupHandler()
		w := run(map[string]string{
			"token":       "reset-token",
			"newPassword": "123",
		}, h)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
		if *called {
			t.Fatal("expected applyPasswordReset not to be called")
		}
	})
}
