package repository

import (
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
)

func TestSplitKeywords_ChineseQuestion(t *testing.T) {
	terms := splitKeywords("壁画修复的标准流程是什么？")

	has := func(target string) bool {
		for _, term := range terms {
			if term == target {
				return true
			}
		}
		return false
	}

	if !has("壁画修复") {
		t.Fatalf("expected token 壁画修复 in %v", terms)
	}
	if !has("标准流程") {
		t.Fatalf("expected token 标准流程 in %v", terms)
	}
}

func TestScoreKnowledgeDoc_Relevance(t *testing.T) {
	query := "壁画修复流程"
	terms := splitKeywords(query)

	high := model.KnowledgeDoc{
		Title:   "北齐壁画修复流程指南",
		Content: "包含评估、清洗、加固与封护步骤",
	}
	low := model.KnowledgeDoc{
		Title:   "文物影像归档规范",
		Content: "主要介绍命名与留痕要求",
	}

	highScore := scoreKnowledgeDoc(high, query, terms)
	lowScore := scoreKnowledgeDoc(low, query, terms)
	if highScore <= lowScore {
		t.Fatalf("expected high score > low score, got %d <= %d", highScore, lowScore)
	}
}
