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
	db *gorm.DB
	jm *pkgjwt.Manager
}

func NewAuthHandler(db *gorm.DB, jm *pkgjwt.Manager) *AuthHandler {
	return &AuthHandler{db: db, jm: jm}
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
	NewPassword string `json:"newPassword" binding:"required,min=6"`
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
		},
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

	var resetToken model.PasswordResetToken
	if err := h.db.Where("token = ?", req.Token).First(&resetToken).Error; err != nil {
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

	hashed, err := hash.Password(req.NewPassword)
	if err != nil {
		response.ServerError(c)
		return
	}

	// 事务：更新密码 + 标记令牌已使用
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.User{}).Where("id = ?", resetToken.UserID).Update("password", hashed).Error; err != nil {
			return err
		}
		return tx.Model(&resetToken).Update("used", true).Error
	})
	if err != nil {
		response.ServerError(c)
		return
	}

	response.OK(c, gin.H{"message": "密码重置成功"})
}
