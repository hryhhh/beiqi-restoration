package database

import (
	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Init 初始化数据库连接并执行自动迁移
func Init(cfg *config.DatabaseConfig) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		logger.L.Fatalf("数据库连接失败: %v", err)
	}

	// 自动迁移所有模型
	if err := db.AutoMigrate(
		&model.User{},
		&model.PasswordResetToken{},
		&model.Mural{},
		&model.MuralImage{},
		&model.MuralAsset{},
		&model.MuralHistory{},
		&model.DamageAnnotation{},
		&model.AnnotationSnapshot{},
		&model.Project{},
		&model.ProjectPhase{},
		&model.RestTask{},
		&model.TaskAttachment{},
		&model.MaterialRecord{},
		&model.RestorationPlan{},
		&model.PlanReview{},
		&model.PlanStatusChange{},
		&model.KnowledgeDoc{},
		&model.AuditLog{},
	); err != nil {
		logger.L.Fatalf("数据库迁移失败: %v", err)
	}

	logger.L.Info("数据库连接和迁移完成")
	return db
}
