package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// R 统一响应结构
type R struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Details interface{} `json:"details,omitempty"`
}

// Paginated 分页响应数据
type Paginated struct {
	Data     interface{} `json:"data"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
}

// OK 成功响应
func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, R{Code: 0, Message: "success", Data: data})
}

// OKPaginated 分页成功响应
func OKPaginated(c *gin.Context, data interface{}, total int64, page, pageSize int) {
	c.JSON(http.StatusOK, R{
		Code:    0,
		Message: "success",
		Data:    Paginated{Data: data, Total: total, Page: page, PageSize: pageSize},
	})
}

// Created 创建成功
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, R{Code: 0, Message: "success", Data: data})
}

// Fail 通用错误响应
func Fail(c *gin.Context, httpCode int, code int, message string) {
	c.JSON(httpCode, R{Code: code, Message: message})
}

// FailWithDetails 带详情的错误响应（用于校验失败）
func FailWithDetails(c *gin.Context, httpCode int, code int, message string, details interface{}) {
	c.JSON(httpCode, R{Code: code, Message: message, Details: details})
}

// 常用错误快捷方法

func BadRequest(c *gin.Context, message string) {
	Fail(c, http.StatusBadRequest, 40000, message)
}

func ValidationError(c *gin.Context, details interface{}) {
	FailWithDetails(c, http.StatusBadRequest, 40001, "校验失败", details)
}

func Unauthorized(c *gin.Context, message string) {
	Fail(c, http.StatusUnauthorized, 40100, message)
}

func Forbidden(c *gin.Context, message string) {
	Fail(c, http.StatusForbidden, 40300, message)
}

func NotFound(c *gin.Context, resource string) {
	Fail(c, http.StatusNotFound, 40400, resource+"不存在")
}

func Conflict(c *gin.Context, message string) {
	Fail(c, http.StatusConflict, 40900, message)
}

func ServerError(c *gin.Context) {
	Fail(c, http.StatusInternalServerError, 50000, "服务器内部错误")
}

func ServiceUnavailable(c *gin.Context, message string) {
	Fail(c, http.StatusServiceUnavailable, 50300, message)
}
