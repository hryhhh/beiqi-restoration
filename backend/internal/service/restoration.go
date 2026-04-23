package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/hry/beiqi-mural-guardian/backend/internal/domain"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/hash"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/imaging"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/storage"
	"gorm.io/datatypes"
)

var (
	ErrMissingSourceFile      = errors.New("missing_source_file")
	ErrMissingMuralID         = errors.New("missing_mural_id")
	ErrPartialNeedsSelection  = errors.New("partial_needs_selection")
	ErrMissingStorage         = errors.New("missing_storage")
	ErrMissingProvider        = errors.New("missing_provider")
	ErrResultAlreadyCommitted = errors.New("result_already_committed")
)

type GenerateRunInput struct {
	MuralID         string
	Mode            model.RestorationMode
	HasSourceFile   bool
	AnnotationIDs   []string
	ManualSelection *domain.AnnotationCoordinates
}

type CreateRunRequest struct {
	Input          GenerateRunInput
	FileName       string
	ContentType    string
	FileBytes      []byte
	ParametersJSON []byte
	ChangedBy      string
}

type RestorationDetail struct {
	Run           model.RestorationRun      `json:"run"`
	Results       []model.RestorationResult `json:"results"`
	CurrentResult model.RestorationResult   `json:"currentResult"`
	Variants      []model.RestorationResult `json:"variants"`
}

type CommitResultResponse struct {
	Run        model.RestorationRun    `json:"run"`
	Result     model.RestorationResult `json:"result"`
	MuralImage model.MuralImage        `json:"muralImage"`
}

type RestorationService struct {
	repo     *repository.RestorationRepository
	provider RestorationProvider
	storage  *storage.LocalStorage
}

func NewRestorationService(
	repo *repository.RestorationRepository,
	provider RestorationProvider,
	store *storage.LocalStorage,
) *RestorationService {
	if provider == nil {
		provider = ServerMockRestorationProvider{}
	}
	return &RestorationService{repo: repo, provider: provider, storage: store}
}

func ValidateGenerateInput(input GenerateRunInput) error {
	if input.MuralID == "" {
		return ErrMissingMuralID
	}
	if !input.HasSourceFile {
		return ErrMissingSourceFile
	}
	if input.Mode == model.RestorationModePartial && len(input.AnnotationIDs) == 0 && input.ManualSelection == nil {
		return ErrPartialNeedsSelection
	}
	return nil
}

func (s *RestorationService) CreateRun(req CreateRunRequest) (*RestorationDetail, error) {
	if err := ValidateGenerateInput(req.Input); err != nil {
		return nil, err
	}
	if s.storage == nil {
		return nil, ErrMissingStorage
	}
	if s.provider == nil {
		return nil, ErrMissingProvider
	}

	runID := uuid.NewString()
	resultID := uuid.NewString()
	subDir := filepath.Join("restoration", req.Input.MuralID, runID)
	sourceExt := extFromFilename(req.FileName, req.ContentType)

	sourceHash, err := hash.FileSHA256(bytes.NewReader(req.FileBytes))
	if err != nil {
		return nil, err
	}
	sourcePath, err := s.storage.Save(subDir, "source"+sourceExt, bytes.NewReader(req.FileBytes))
	if err != nil {
		return nil, err
	}
	sourceWidth, sourceHeight := decodeImageSize(req.FileBytes)

	generated, err := s.provider.GeneratePrimary(GeneratePrimaryRequest{
		SourceBytes:     req.FileBytes,
		ContentType:     req.ContentType,
		ParametersJSON:  req.ParametersJSON,
		AnnotationIDs:   req.Input.AnnotationIDs,
		ManualSelection: req.Input.ManualSelection,
	})
	if err != nil {
		return nil, err
	}
	resultPath, resultHash, err := s.saveGeneratedImage(subDir, resultID, generated)
	if err != nil {
		return nil, err
	}

	parameters := defaultJSON(req.ParametersJSON, "{}")
	annotationIDs := marshalJSON(req.Input.AnnotationIDs, "[]")
	manualSelection := datatypes.JSON(nil)
	if req.Input.ManualSelection != nil {
		manualSelection = marshalJSON(req.Input.ManualSelection, "null")
	}

	run := &model.RestorationRun{
		ID:                 runID,
		MuralID:            req.Input.MuralID,
		Mode:               req.Input.Mode,
		SourceImagePath:    sourcePath,
		SourceImageHash:    sourceHash,
		SourceImageWidth:   sourceWidth,
		SourceImageHeight:  sourceHeight,
		SourceImageSize:    int64(len(req.FileBytes)),
		ParametersSnapshot: parameters,
		AnnotationIDs:      annotationIDs,
		ManualSelection:    manualSelection,
		Status:             model.RestorationRunSucceeded,
		LatestResultID:     &resultID,
		CreatedBy:          fallbackChangedBy(req.ChangedBy),
	}
	result := &model.RestorationResult{
		ID:                 resultID,
		RunID:              runID,
		SourceType:         model.RestorationSourcePrimary,
		ImagePath:          resultPath,
		ImageHash:          resultHash,
		Width:              generated.Width,
		Height:             generated.Height,
		FileSize:           generated.FileSize,
		ParametersSnapshot: parameters,
		IsMock:             generated.IsMock,
		ProviderName:       generated.ProviderName,
	}

	if err := s.repo.CreateRunWithResult(run, result); err != nil {
		return nil, err
	}
	return buildRestorationDetail(*run, []model.RestorationResult{*result}), nil
}

func (s *RestorationService) CreateVariant(runID, baseResultID, changedBy string) (*RestorationDetail, error) {
	if s.storage == nil {
		return nil, ErrMissingStorage
	}
	if s.provider == nil {
		return nil, ErrMissingProvider
	}

	run, results, err := s.repo.GetRunWithResults(runID)
	if err != nil {
		return nil, err
	}
	baseResult, err := s.repo.GetResultInRun(runID, baseResultID)
	if err != nil {
		return nil, err
	}

	sourceBytes, err := s.storage.Read(run.SourceImagePath)
	if err != nil {
		return nil, err
	}
	baseBytes, err := s.storage.Read(baseResult.ImagePath)
	if err != nil {
		return nil, err
	}

	generated, err := s.provider.GenerateVariant(GenerateVariantRequest{
		SourceBytes:     sourceBytes,
		BaseResultBytes: baseBytes,
		ParametersJSON:  run.ParametersSnapshot,
	})
	if err != nil {
		return nil, err
	}

	resultID := uuid.NewString()
	resultPath, resultHash, err := s.saveGeneratedImage(filepath.Join("restoration", run.MuralID, run.ID), resultID, generated)
	if err != nil {
		return nil, err
	}
	result := &model.RestorationResult{
		ID:                 resultID,
		RunID:              run.ID,
		ParentResultID:     &baseResult.ID,
		SourceType:         model.RestorationSourceVariant,
		ImagePath:          resultPath,
		ImageHash:          resultHash,
		Width:              generated.Width,
		Height:             generated.Height,
		FileSize:           generated.FileSize,
		ParametersSnapshot: defaultJSON(run.ParametersSnapshot, "{}"),
		IsMock:             generated.IsMock,
		ProviderName:       generated.ProviderName,
	}
	if err := s.repo.CreateResultAndUpdateRun(run.ID, result); err != nil {
		return nil, err
	}

	run.LatestResultID = &result.ID
	run.Status = model.RestorationRunSucceeded
	_ = changedBy
	results = append(results, *result)
	return buildRestorationDetail(*run, results), nil
}

func (s *RestorationService) GetRunDetail(runID string) (*RestorationDetail, error) {
	run, results, err := s.repo.GetRunWithResults(runID)
	if err != nil {
		return nil, err
	}
	return buildRestorationDetail(*run, results), nil
}

func (s *RestorationService) ListRuns(muralID string, limit int) ([]model.RestorationRun, error) {
	return s.repo.ListRuns(muralID, limit)
}

func (s *RestorationService) CommitResult(resultID, changedBy string) (*CommitResultResponse, error) {
	if s.storage == nil {
		return nil, ErrMissingStorage
	}

	result, run, err := s.repo.GetResultWithRun(resultID)
	if err != nil {
		return nil, err
	}
	if result.CommittedMuralImageID != nil {
		return nil, ErrResultAlreadyCommitted
	}

	data, err := s.storage.Read(result.ImagePath)
	if err != nil {
		return nil, err
	}
	ext := filepath.Ext(result.ImagePath)
	if ext == "" {
		ext = ".png"
	}
	relPath, err := s.storage.Save(filepath.Join("murals", run.MuralID), "restored-"+result.ID+ext, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	width, height := result.Width, result.Height
	if width == 0 || height == 0 {
		width, height = decodeImageSize(data)
	}

	image := &model.MuralImage{
		ID:        uuid.NewString(),
		MuralID:   run.MuralID,
		FilePath:  relPath,
		FileHash:  result.ImageHash,
		ImageType: model.ImageRestored,
		Width:     width,
		Height:    height,
		FileSize:  int64(len(data)),
	}
	if err := s.repo.CommitResult(run, result, image, fallbackChangedBy(changedBy)); err != nil {
		return nil, err
	}

	return &CommitResultResponse{
		Run:        *run,
		Result:     *result,
		MuralImage: *image,
	}, nil
}

func (s *RestorationService) saveGeneratedImage(subDir, resultID string, generated *GeneratedImage) (string, string, error) {
	ext := generated.Ext
	if strings.TrimSpace(ext) == "" {
		ext = ".png"
	}
	path, err := s.storage.Save(subDir, "result-"+resultID+ext, bytes.NewReader(generated.Bytes))
	if err != nil {
		return "", "", err
	}
	fileHash, err := hash.FileSHA256(bytes.NewReader(generated.Bytes))
	if err != nil {
		return "", "", err
	}
	if generated.FileSize == 0 {
		generated.FileSize = int64(len(generated.Bytes))
	}
	return path, fileHash, nil
}

func buildRestorationDetail(run model.RestorationRun, results []model.RestorationResult) *RestorationDetail {
	current := model.RestorationResult{}
	var variants []model.RestorationResult
	for _, result := range results {
		if result.SourceType == model.RestorationSourceVariant {
			variants = append(variants, result)
		}
		if run.LatestResultID != nil && result.ID == *run.LatestResultID {
			current = result
		}
	}
	if current.ID == "" && len(results) > 0 {
		current = results[len(results)-1]
	}
	return &RestorationDetail{
		Run:           run,
		Results:       results,
		CurrentResult: current,
		Variants:      variants,
	}
}

func defaultJSON(raw []byte, fallback string) datatypes.JSON {
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 || !json.Valid(trimmed) {
		return datatypes.JSON([]byte(fallback))
	}
	return datatypes.JSON(append([]byte(nil), trimmed...))
}

func marshalJSON(value interface{}, fallback string) datatypes.JSON {
	raw, err := json.Marshal(value)
	if err != nil {
		return datatypes.JSON([]byte(fallback))
	}
	return datatypes.JSON(raw)
}

func decodeImageSize(data []byte) (int, int) {
	_, info, err := imaging.Decode(bytes.NewReader(data))
	if err != nil {
		return 0, 0
	}
	return info.Width, info.Height
}

func extFromFilename(filename, contentType string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != "" {
		return ext
	}
	switch contentType {
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	default:
		return ".png"
	}
}

func fallbackChangedBy(changedBy string) string {
	if strings.TrimSpace(changedBy) == "" {
		return "system"
	}
	return changedBy
}
