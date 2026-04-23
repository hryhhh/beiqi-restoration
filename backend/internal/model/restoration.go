package model

import (
	"time"

	"gorm.io/datatypes"
)

type RestorationMode string

const (
	RestorationModeFull    RestorationMode = "full"
	RestorationModePartial RestorationMode = "partial"
)

type RestorationRunStatus string

const (
	RestorationRunSucceeded RestorationRunStatus = "succeeded"
	RestorationRunFailed    RestorationRunStatus = "failed"
)

type RestorationSourceType string

const (
	RestorationSourcePrimary RestorationSourceType = "primary"
	RestorationSourceVariant RestorationSourceType = "variant"
)

type RestorationRun struct {
	ID                 string               `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MuralID            string               `gorm:"type:uuid;not null;index" json:"muralId"`
	Mode               RestorationMode      `gorm:"type:varchar(20);not null" json:"mode"`
	SourceImagePath    string               `gorm:"not null" json:"sourceImagePath"`
	SourceImageHash    string               `gorm:"not null" json:"sourceImageHash"`
	SourceImageWidth   int                  `json:"sourceImageWidth"`
	SourceImageHeight  int                  `json:"sourceImageHeight"`
	SourceImageSize    int64                `json:"sourceImageSize"`
	ParametersSnapshot datatypes.JSON       `gorm:"type:jsonb;not null;default:'{}'" json:"parametersSnapshot"`
	AnnotationIDs      datatypes.JSON       `gorm:"type:jsonb;not null;default:'[]'" json:"annotationIds"`
	ManualSelection    datatypes.JSON       `gorm:"type:jsonb" json:"manualSelection"`
	Status             RestorationRunStatus `gorm:"type:varchar(20);not null" json:"status"`
	LatestResultID     *string              `gorm:"type:uuid" json:"latestResultId"`
	CommittedResultID  *string              `gorm:"type:uuid" json:"committedResultId"`
	CreatedBy          string               `gorm:"not null" json:"createdBy"`
	CreatedAt          time.Time            `json:"createdAt"`
	UpdatedAt          time.Time            `json:"updatedAt"`

	Results []RestorationResult `gorm:"foreignKey:RunID" json:"results,omitempty"`
}

type RestorationResult struct {
	ID                    string                `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RunID                 string                `gorm:"type:uuid;not null;index" json:"runId"`
	ParentResultID        *string               `gorm:"type:uuid;index" json:"parentResultId"`
	SourceType            RestorationSourceType `gorm:"type:varchar(20);not null" json:"sourceType"`
	ImagePath             string                `gorm:"not null" json:"imagePath"`
	ImageHash             string                `gorm:"not null" json:"imageHash"`
	Width                 int                   `json:"width"`
	Height                int                   `json:"height"`
	FileSize              int64                 `json:"fileSize"`
	ParametersSnapshot    datatypes.JSON        `gorm:"type:jsonb;not null;default:'{}'" json:"parametersSnapshot"`
	IsMock                bool                  `json:"isMock"`
	ProviderName          string                `gorm:"not null" json:"providerName"`
	CommittedMuralImageID *string               `gorm:"type:uuid" json:"committedMuralImageId"`
	CreatedAt             time.Time             `json:"createdAt"`
}
