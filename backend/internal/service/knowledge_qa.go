package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
)

// QAResult 问答结果
type QAResult struct {
	Answer  string          `json:"answer"`
	Sources []QASourceRef   `json:"sources"`
}

// QASourceRef 引用来源
type QASourceRef struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Category string `json:"category"`
}

type KnowledgeQAService struct {
	repo   *repository.KnowledgeRepository
	llmCfg *config.LLMConfig
	client *http.Client
}

func NewKnowledgeQAService(repo *repository.KnowledgeRepository, llmCfg *config.LLMConfig) *KnowledgeQAService {
	return &KnowledgeQAService{
		repo:   repo,
		llmCfg: llmCfg,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

// Available 判断 LLM 服务是否配置
func (s *KnowledgeQAService) Available() bool {
	return s.llmCfg.BaseURL != "" && s.llmCfg.APIKey != ""
}

// Ask 根据知识库内容回答问题
func (s *KnowledgeQAService) Ask(question string) (*QAResult, error) {
	// 1. 从知识库搜索相关文档
	docs, err := s.repo.Search(question)
	if err != nil {
		return nil, err
	}

	// 取前 5 篇最相关的
	if len(docs) > 5 {
		docs = docs[:5]
	}

	// 构建引用来源
	sources := make([]QASourceRef, len(docs))
	for i, d := range docs {
		sources[i] = QASourceRef{ID: d.ID, Title: d.Title, Category: string(d.Category)}
	}

	// 2. 如果 LLM 不可用，降级为返回搜索摘要
	if !s.Available() {
		answer := buildFallbackAnswer(question, docs)
		return &QAResult{Answer: answer, Sources: sources}, nil
	}

	// 3. 拼接上下文调用 LLM
	context := buildContext(docs)
	answer, err := s.callLLM(question, context)
	if err != nil {
		logger.L.Errorf("LLM 调用失败，降级为搜索摘要: %v", err)
		return &QAResult{Answer: buildFallbackAnswer(question, docs), Sources: sources}, nil
	}

	return &QAResult{Answer: answer, Sources: sources}, nil
}

// buildContext 将文档拼接为 LLM 上下文
func buildContext(docs []model.KnowledgeDoc) string {
	var sb strings.Builder
	for i, d := range docs {
		// 每篇文档截取前 1500 字符，避免超出 token 限制
		content := d.Content
		if len(content) > 1500 {
			content = content[:1500] + "..."
		}
		sb.WriteString(fmt.Sprintf("【文档%d】%s\n%s\n\n", i+1, d.Title, content))
	}
	return sb.String()
}

// buildFallbackAnswer LLM 不可用时的降级回答
func buildFallbackAnswer(question string, docs []model.KnowledgeDoc) string {
	if len(docs) == 0 {
		return "抱歉，知识库中未找到与您问题相关的内容。请尝试换个关键词提问。"
	}
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("根据知识库搜索，找到 %d 篇相关文档：\n\n", len(docs)))
	for i, d := range docs {
		excerpt := d.Content
		if len(excerpt) > 200 {
			excerpt = excerpt[:200] + "..."
		}
		sb.WriteString(fmt.Sprintf("**%d. %s**\n%s\n\n", i+1, d.Title, excerpt))
	}
	sb.WriteString("_（AI 问答服务暂不可用，以上为知识库搜索结果摘要）_")
	return sb.String()
}

// OpenAI 兼容 API 请求/响应结构
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
}

func (s *KnowledgeQAService) callLLM(question, context string) (string, error) {
	systemPrompt := `你是北齐壁画修复系统的知识库助手。请根据以下知识库文档内容回答用户的问题。
要求：
1. 只根据提供的文档内容回答，不要编造信息
2. 如果文档中没有相关内容，请如实告知
3. 回答要专业、准确、简洁
4. 适当引用文档来源（如"根据《xxx》..."）
5. 使用中文回答`

	userPrompt := fmt.Sprintf("知识库文档：\n%s\n\n用户问题：%s", context, question)

	body, _ := json.Marshal(chatRequest{
		Model: s.llmCfg.Model,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	})

	url := strings.TrimRight(s.llmCfg.BaseURL, "/") + "/chat/completions"
	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.llmCfg.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求 LLM 失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("LLM 返回 %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("解析 LLM 响应失败: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("LLM 返回空结果")
	}

	return chatResp.Choices[0].Message.Content, nil
}
