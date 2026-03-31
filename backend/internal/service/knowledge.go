package service

import (
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
)

type KnowledgeService struct {
	repo *repository.KnowledgeRepository
}

func NewKnowledgeService(repo *repository.KnowledgeRepository) *KnowledgeService {
	return &KnowledgeService{repo: repo}
}

func (s *KnowledgeService) List(params repository.KnowledgeListParams) ([]model.KnowledgeDoc, int64, error) {
	return s.repo.List(params)
}

func (s *KnowledgeService) Search(keyword string) ([]model.KnowledgeDoc, error) {
	return s.repo.Search(keyword)
}

func (s *KnowledgeService) GetByID(id string) (*model.KnowledgeDoc, error) {
	return s.repo.GetByID(id)
}

func (s *KnowledgeService) Create(doc *model.KnowledgeDoc) error {
	return s.repo.Create(doc)
}

// Update 更新文档（标题、分类、内容）
func (s *KnowledgeService) Update(id string, title, content string, category model.DocCategory) (*model.KnowledgeDoc, error) {
	doc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	doc.Title = title
	doc.Content = content
	doc.Category = category
	return doc, s.repo.Update(doc)
}

func (s *KnowledgeService) Delete(id string) error {
	if _, err := s.repo.GetByID(id); err != nil {
		return err
	}
	return s.repo.Delete(id)
}
