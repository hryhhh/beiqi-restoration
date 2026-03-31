package handler

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	pkgjwt "github.com/hry/beiqi-mural-guardian/backend/pkg/jwt"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/response"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db                 *gorm.DB
	jm                 *pkgjwt.Manager
	findUserByID       func(id string) (*model.User, error)
	findResetTokenByID func(token string) (*model.PasswordResetToken, error)
	applyPasswordReset func(resetToken *model.PasswordResetToken, hashedPassword string) error
}

func NewAuthHandler(db *gorm.DB, jm *pkgjwt.Manager) *AuthHandler {
	h := &AuthHandler{db: db, jm: jm}
	h.findUserByID = func(id string) (*model.User, error) {
		var user model.User
		if err := h.db.Where("id = ?", id).First(&user).Error; err != nil {
			return nil, err
		}
		return &user, nil
	}
	h.findResetTokenByID = func(token string) (*model.PasswordResetToken, error) {
		var resetToken model.PasswordResetToken
		if err := h.db.Where("token = ?", token).First(&resetToken).Error; err != nil {
			return nil, err
		}
		return &resetToken, nil
	}
	h.applyPasswordReset = func(resetToken *model.PasswordResetToken, hashedPassword string) error {
		return h.db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&model.User{}).Where("id = ?", resetToken.UserID).Update("password", hashedPassword).Error; err != nil {
				return err
			}
			return tx.Model(resetToken).Update("used", true).Error
		})
	}
	return h
}

type loginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type registerReq struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type resetPasswordReq struct {
	Email string `json:"email" binding:"required,email"`
}

type confirmResetReq struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword"`
	Password    string `json:"password"` // 兼容旧前端字段
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	var user model.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		response.Unauthorized(c, "用户名或密码错误")
		return
	}

	if !hash.CheckPassword(req.Password, user.Password) {
		response.Unauthorized(c, "用户名或密码错误")
		return
	}

	token, err := h.jm.Generate(user.ID, string(user.Role))
	if err != nil {
		logger.L.Errorf("生成令牌失败: %v", err)
		response.ServerError(c)
		return
	}

	response.OK(c, gin.H{
		"token": token,
		"user": gin.H{
			"id": user.ID, "username": user.Username,
			"email": user.Email, "role": user.Role, "avatar": user.Avatar,
			"createdAt": user.CreatedAt, "updatedAt": user.UpdatedAt,
		},
	})
}

// Me 获取当前登录用户信息
func (h *AuthHandler) Me(c *gin.Context) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		response.Unauthorized(c, "缺少用户信息")
		return
	}

	userID, ok := userIDVal.(string)
	if !ok || userID == "" {
		response.Unauthorized(c, "用户信息无效")
		return
	}

	user, err := h.findUserByID(userID)
	if err != nil {
		response.Unauthorized(c, "用户不存在")
		return
	}

	response.OK(c, gin.H{
		"id": user.ID, "username": user.Username,
		"email": user.Email, "role": user.Role, "avatar": user.Avatar,
		"createdAt": user.CreatedAt, "updatedAt": user.UpdatedAt,
	})
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	// 检查用户名和邮箱唯一性
	var count int64
	h.db.Model(&model.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		response.Conflict(c, "用户名或邮箱已存在")
		return
	}

	hashed, err := hash.Password(req.Password)
	if err != nil {
		response.ServerError(c)
		return
	}

	user := model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashed,
		Role:     model.RoleResearcher, // 默认角色
	}
	if err := h.db.Create(&user).Error; err != nil {
		logger.L.Errorf("创建用户失败: %v", err)
		response.ServerError(c)
		return
	}

	response.Created(c, gin.H{"id": user.ID, "username": user.Username, "role": user.Role})
}

// ResetPassword 请求密码重置
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	var user model.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// 不暴露用户是否存在
		response.OK(c, gin.H{"message": "如果邮箱存在，重置链接已发送"})
		return
	}

	// 生成随机令牌
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		response.ServerError(c)
		return
	}
	token := hex.EncodeToString(tokenBytes)

	resetToken := model.PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	if err := h.db.Create(&resetToken).Error; err != nil {
		response.ServerError(c)
		return
	}

	// TODO: 实际发送邮件/通知，这里直接返回令牌（开发环境）
	response.OK(c, gin.H{"message": "如果邮箱存在，重置链接已发送", "token": token})
}

// ConfirmResetPassword 确认密码重置
func (h *AuthHandler) ConfirmResetPassword(c *gin.Context) {
	var req confirmResetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数无效")
		return
	}

	newPassword := req.NewPassword
	if newPassword == "" {
		newPassword = req.Password
	}
	if len(newPassword) < 6 {
		response.BadRequest(c, "请求参数无效")
		return
	}

	resetToken, err := h.findResetTokenByID(req.Token)
	if err != nil {
		response.BadRequest(c, "重置令牌无效")
		return
	}

	if resetToken.Used {
		response.BadRequest(c, "重置令牌已使用")
		return
	}

	if time.Now().After(resetToken.ExpiresAt) {
		response.BadRequest(c, "重置令牌已过期")
		return
	}

	hashed, err := hash.Password(newPassword)
	if err != nil {
		response.ServerError(c)
		return
	}

	if err := h.applyPasswordReset(resetToken, hashed); err != nil {
		response.ServerError(c)
		return
	}

	response.OK(c, gin.H{"message": "密码重置成功"})
}
