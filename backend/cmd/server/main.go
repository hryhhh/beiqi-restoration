package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/database"
	"github.com/hry/beiqi-mural-guardian/backend/internal/handler"
	"github.com/hry/beiqi-mural-guardian/backend/internal/middleware"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/internal/service"
	pkgjwt "github.com/hry/beiqi-mural-guardian/backend/pkg/jwt"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/storage"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	logger.Init(cfg.Log.Level, cfg.Log.File)
	defer logger.L.Sync()

	db := database.Init(&cfg.Database)
	jm := pkgjwt.NewManager(cfg.JWT.Secret, cfg.JWT.ExpireHours)
	store := storage.NewLocalStorage(cfg.Upload.Dir)

	gin.SetMode(cfg.Server.Mode)
	r := gin.New()
	r.Use(gin.Recovery(), middleware.CORS(), middleware.RequestLogger())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 静态文件服务：上传的图片可通过 /uploads/xxx 访问
	r.Static("/uploads", cfg.Upload.Dir)

	// 公开接口
	publicHandler := handler.NewPublicHandler(db)
	r.GET("/api/public/landing", publicHandler.Landing)

	// 认证路由
	authHandler := handler.NewAuthHandler(db, jm)
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
		auth.POST("/reset-password", authHandler.ResetPassword)
		auth.POST("/reset-password/confirm", authHandler.ConfirmResetPassword)
	}

	// 需要认证的路由
	api := r.Group("/api")
	api.Use(middleware.JWTAuth(jm), middleware.AuditLog(db))
	api.GET("/auth/me", authHandler.Me)

	// 壁画模块
	muralRepo := repository.NewMuralRepository(db)
	muralSvc := service.NewMuralService(muralRepo)
	muralHandler := handler.NewMuralHandler(muralSvc, db, store)
	imageHandler := handler.NewImageHandler(db, store)
	assetHandler := handler.NewAssetHandler(db, store)

	murals := api.Group("/murals")
	{
		murals.GET("", muralHandler.List)
		murals.GET("/:id", muralHandler.GetByID)
		murals.GET("/:id/history", muralHandler.GetHistory)
		// 创建/编辑：管理员 + 首席修复师
		murals.POST("", middleware.RequireRoles(middleware.MuralManageRoles()...), muralHandler.Create)
		murals.PUT("/:id", middleware.RequireRoles(middleware.MuralManageRoles()...), muralHandler.Update)
		murals.DELETE("/:id", middleware.RequireRoles(middleware.MuralManageRoles()...), muralHandler.Delete)
		murals.POST("/:id/images", middleware.RequireRoles(middleware.MuralImageUploadRoles()...), imageHandler.Upload)
		murals.DELETE("/:id/images/:imageId", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), imageHandler.Delete)
		murals.POST("/:id/assets", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), assetHandler.Upload)
		murals.DELETE("/:id/assets/:assetId", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), assetHandler.Delete)
		murals.PUT("/:id/assets/:assetId/default", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), assetHandler.SetDefault)
		murals.POST("/import", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), muralHandler.BatchImport)
	}

	// 标注模块
	annoRepo := repository.NewAnnotationRepository(db)
	annoSvc := service.NewAnnotationService(annoRepo)
	annoHandler := handler.NewAnnotationHandler(annoSvc, db)

	annotations := murals.Group("/:id/annotations")
	{
		annotations.GET("", annoHandler.List)
		annotations.POST("", middleware.RequireRoles(middleware.AnnotationWriteRoles()...), annoHandler.Create)
		annotations.PUT("/:annotationId", middleware.RequireRoles(middleware.AnnotationWriteRoles()...), annoHandler.Update)
		annotations.DELETE("/:annotationId", middleware.RequireRoles(middleware.AnnotationWriteRoles()...), annoHandler.Delete)
		annotations.GET("/:annotationId/versions", annoHandler.GetVersions)
	}

	// 项目模块
	projectSvc := service.NewProjectService(db)
	projectHandler := handler.NewProjectHandler(projectSvc, db)

	projects := api.Group("/projects")
	{
		projects.GET("", projectHandler.List)
		projects.GET("/:id", projectHandler.GetByID)
		projects.POST("", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.Create)
		projects.PUT("/:id", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.Update)
		projects.DELETE("/:id", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.Delete)
		projects.PUT("/:id/complete", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.Complete)
		projects.POST("/:id/tasks", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.CreateTask)
		projects.PUT("/:id/tasks/:taskId", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher), projectHandler.UpdateTask)
		projects.PUT("/:id/tasks/:taskId/assign", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.AssignTask)
		projects.POST("/:id/tasks/:taskId/attachments", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher), projectHandler.UploadAttachment)
		projects.POST("/:id/materials", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), projectHandler.AddMaterial)
	}

	// 修复方案模块
	planHandler := handler.NewPlanHandler(db, store)
	plans := api.Group("/plans")
	{
		plans.GET("", planHandler.List)
		plans.GET("/:id", planHandler.GetByID)
		plans.POST("", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher), planHandler.Create)
		plans.PUT("/:id", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher), planHandler.UpdateStatus)
		plans.POST("/:id/review", middleware.RequireRoles(middleware.PlanReviewRoles()...), planHandler.Review)
		plans.PUT("/:id/content", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant, model.RoleResearcher), planHandler.UpdateContent)
		plans.DELETE("/:id", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer), planHandler.Delete)
		plans.POST("/:id/image", middleware.RequireRoles(model.RoleAdmin, model.RoleChiefRestorer, model.RoleAssistant), planHandler.UploadImage)
	}

	// 仪表盘模块
	dashHandler := handler.NewDashboardHandler(db)
	dash := api.Group("/dashboard")
	{
		dash.GET("/summary", dashHandler.Summary)
		dash.GET("/alerts", dashHandler.Alerts)
		dash.GET("/charts", dashHandler.Charts)
	}

	// 图像分析模块
	analysisHandler := handler.NewAnalysisHandler(db, nil) // AI 服务暂未对接，传 nil 降级为手动标注
	analysis := api.Group("/analysis")
	{
		analysis.POST("/detect", analysisHandler.Detect)
		analysis.POST("/confirm", analysisHandler.Confirm)
		analysis.POST("/report", analysisHandler.Report)
	}

	// 壁画修复工作台模块
	restorationRepo := repository.NewRestorationRepository(db)
	restorationProvider := service.NewRestorationProvider(&cfg.Restoration)
	restorationSvc := service.NewRestorationService(restorationRepo, restorationProvider, store)
	restorationHandler := handler.NewRestorationHandler(restorationSvc)
	restoration := api.Group("/restoration").Use(middleware.RequireRoles(middleware.RestorationWorkbenchRoles()...))
	{
		restoration.GET("/runs", restorationHandler.ListRuns)
		restoration.POST("/runs", restorationHandler.CreateRun)
		restoration.GET("/runs/:id", restorationHandler.GetRun)
		restoration.POST("/runs/:id/variants", restorationHandler.CreateVariant)
	}

	// 知识库模块
	knowledgeRepo := repository.NewKnowledgeRepository(db)
	knowledgeSvc := service.NewKnowledgeService(knowledgeRepo)
	knowledgeQASvc := service.NewKnowledgeQAService(knowledgeRepo, &cfg.LLM)
	knowledgeHandler := handler.NewKnowledgeHandler(knowledgeSvc, knowledgeQASvc)
	knowledge := api.Group("/knowledge")
	{
		knowledge.GET("", knowledgeHandler.List)
		knowledge.GET("/search", knowledgeHandler.Search)
		knowledge.POST("/qa", knowledgeHandler.Ask)
		knowledge.POST("/qa/stream", knowledgeHandler.AskStream)
		knowledge.GET("/:id", knowledgeHandler.GetByID)
		knowledge.POST("", middleware.RequireRoles(middleware.AdminOnlyRoles()...), knowledgeHandler.Create)
		knowledge.PUT("/:id", middleware.RequireRoles(model.RoleAdmin), knowledgeHandler.Update)
		knowledge.DELETE("/:id", middleware.RequireRoles(model.RoleAdmin), knowledgeHandler.Delete)
	}

	// 管理后台模块
	adminHandler := handler.NewAdminHandler(db, &cfg.Database)
	admin := api.Group("/admin").Use(middleware.RequireRoles(middleware.AdminOnlyRoles()...))
	{
		admin.GET("/users", adminHandler.ListUsers)
		admin.PUT("/users/:id/role", adminHandler.UpdateRole)
		admin.GET("/logs", adminHandler.ListLogs)
		admin.POST("/backup", adminHandler.Backup)
		admin.POST("/export", adminHandler.Export)
		admin.PUT("/users/:id/reset-password", adminHandler.ResetUserPassword)
		admin.DELETE("/users/:id", adminHandler.DeleteUser)
	}

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	logger.L.Infof("服务器启动于 %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
