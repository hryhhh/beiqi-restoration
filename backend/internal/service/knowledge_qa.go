package service

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
	"github.com/hry/beiqi-mural-guardian/backend/internal/model"
	"github.com/hry/beiqi-mural-guardian/backend/internal/repository"
	"github.com/hry/beiqi-mural-guardian/backend/pkg/logger"
)

type QAMode string

const (
	QAModeLLM      QAMode = "llm"
	QAModeFallback QAMode = "fallback"
)

// QAResult 问答结果
type QAResult struct {
	Answer  string        `json:"answer"`
	Sources []QASourceRef `json:"sources"`
	Mode    QAMode        `json:"mode"`
	Note    string        `json:"note,omitempty"`
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
	if fallbackAnswer, ok := buildSmallTalkAnswer(question); ok {
		if s.Available() {
			answer, err := s.callSmallTalkLLM(question)
			if err != nil {
				logger.L.Errorf("LLM 寒暄调用失败，降级本地回复: %v", err)
			} else {
				answer = strings.TrimSpace(answer)
				if answer != "" {
					return &QAResult{
						Answer: answer,
						Mode:   QAModeLLM,
						Note:   "small_talk_llm",
					}, nil
				}
			}
		}
		return &QAResult{
			Answer: fallbackAnswer,
			Mode:   QAModeFallback,
			Note:   "small_talk",
		}, nil
	}

	question, docs, sources, err := s.prepare(question)
	if err != nil {
		return nil, err
	}

	if question == "" {
		return &QAResult{
			Answer: "请输入具体问题后再提问。",
			Mode:   QAModeFallback,
			Note:   "empty_question",
		}, nil
	}

	if len(docs) == 0 {
		return &QAResult{
			Answer:  buildFallbackAnswer(docs),
			Sources: sources,
			Mode:    QAModeFallback,
			Note:    "no_match",
		}, nil
	}

	// LLM 未配置时降级为检索摘要
	if !s.Available() {
		return &QAResult{
			Answer:  buildFallbackAnswer(docs),
			Sources: sources,
			Mode:    QAModeFallback,
			Note:    "llm_unavailable",
		}, nil
	}

	// LLM 模式
	context := buildContext(docs)
	answer, err := s.callLLM(question, context)
	if err != nil {
		logger.L.Errorf("LLM 调用失败，降级为搜索摘要: %v", err)
		return &QAResult{
			Answer:  buildFallbackAnswer(docs),
			Sources: sources,
			Mode:    QAModeFallback,
			Note:    "llm_error",
		}, nil
	}

	answer = strings.TrimSpace(answer)
	if answer == "" {
		return &QAResult{
			Answer:  buildFallbackAnswer(docs),
			Sources: sources,
			Mode:    QAModeFallback,
			Note:    "llm_empty",
		}, nil
	}

	return &QAResult{
		Answer:  normalizeAnswerCitations(answer, len(sources)),
		Sources: sources,
		Mode:    QAModeLLM,
	}, nil
}

// AskStream 以流式方式返回回答内容（用于前端逐字渲染）
func (s *KnowledgeQAService) AskStream(question string, onToken func(delta string) error) (*QAResult, error) {
	if onToken == nil {
		return nil, errors.New("onToken callback is nil")
	}

	if fallbackAnswer, ok := buildSmallTalkAnswer(question); ok {
		if s.Available() {
			answer, streamed, err := s.callSmallTalkLLMStream(question, onToken)
			if err != nil {
				logger.L.Errorf("LLM 寒暄流式调用失败，降级本地回复: %v", err)
				if streamed {
					return nil, err
				}
			} else {
				answer = strings.TrimSpace(answer)
				if answer != "" {
					return &QAResult{
						Answer: answer,
						Mode:   QAModeLLM,
						Note:   "small_talk_llm",
					}, nil
				}
			}
		}

		result := &QAResult{
			Answer: fallbackAnswer,
			Mode:   QAModeFallback,
			Note:   "small_talk",
		}
		if err := streamByChunks(result.Answer, onToken); err != nil {
			return nil, err
		}
		return result, nil
	}

	question, docs, sources, err := s.prepare(question)
	if err != nil {
		return nil, err
	}

	streamFallback := func(note string) (*QAResult, error) {
		result := &QAResult{
			Answer:  buildFallbackAnswer(docs),
			Sources: sources,
			Mode:    QAModeFallback,
			Note:    note,
		}
		if err := streamByChunks(result.Answer, onToken); err != nil {
			return nil, err
		}
		return result, nil
	}

	if question == "" {
		result := &QAResult{
			Answer: "请输入具体问题后再提问。",
			Mode:   QAModeFallback,
			Note:   "empty_question",
		}
		if err := streamByChunks(result.Answer, onToken); err != nil {
			return nil, err
		}
		return result, nil
	}

	if len(docs) == 0 {
		return streamFallback("no_match")
	}

	if !s.Available() {
		return streamFallback("llm_unavailable")
	}

	context := buildContext(docs)
	answer, streamed, err := s.callLLMStream(question, context, onToken)
	if err != nil {
		logger.L.Errorf("LLM 流式调用失败，降级为搜索摘要: %v", err)
		// 若已经输出过部分 token，不再覆盖，直接返回错误让前端提示。
		if streamed {
			return nil, err
		}
		return streamFallback("llm_error")
	}

	answer = strings.TrimSpace(answer)
	if answer == "" {
		return streamFallback("llm_empty")
	}

	return &QAResult{
		Answer:  normalizeAnswerCitations(answer, len(sources)),
		Sources: sources,
		Mode:    QAModeLLM,
	}, nil
}

func (s *KnowledgeQAService) prepare(question string) (string, []model.KnowledgeDoc, []QASourceRef, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return "", nil, nil, nil
	}

	docs, err := s.repo.Search(question)
	if err != nil {
		return "", nil, nil, err
	}
	docs = topDocs(docs, 5)

	sources := make([]QASourceRef, len(docs))
	for i, d := range docs {
		sources[i] = QASourceRef{ID: d.ID, Title: d.Title, Category: string(d.Category)}
	}
	return question, docs, sources, nil
}

func topDocs(docs []model.KnowledgeDoc, n int) []model.KnowledgeDoc {
	if len(docs) <= n {
		return docs
	}
	return docs[:n]
}

func normalizeSmallTalkQuestion(question string) string {
	question = strings.ToLower(strings.TrimSpace(question))
	if question == "" {
		return ""
	}

	var b strings.Builder
	b.Grow(len(question))
	for _, r := range question {
		switch {
		case unicode.IsSpace(r):
			continue
		case unicode.IsPunct(r):
			continue
		case unicode.IsSymbol(r):
			continue
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

func buildSmallTalkAnswer(question string) (string, bool) {
	q := normalizeSmallTalkQuestion(question)
	if q == "" {
		return "", false
	}

	greetings := map[string]struct{}{
		"hi": {}, "hello": {}, "hey": {}, "yo": {}, "你好": {}, "您好": {}, "嗨": {}, "哈喽": {}, "早上好": {}, "下午好": {}, "晚上好": {},
	}
	if _, ok := greetings[q]; ok {
		return "你好，我是壁画修复知识库助手。你可以问我修复流程、病害判定、材料配比、案例依据等问题。", true
	}

	if strings.Contains(q, "谢谢") || strings.Contains(q, "感谢") || strings.Contains(q, "thx") || strings.Contains(q, "thanks") {
		return "不客气。如果你愿意，我可以继续帮你定位相关文档并给出来源引用。", true
	}

	farewells := map[string]struct{}{
		"bye": {}, "goodbye": {}, "再见": {}, "拜拜": {}, "回头见": {},
	}
	if _, ok := farewells[q]; ok {
		return "好的，随时欢迎再来提问。", true
	}

	return "", false
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
		sb.WriteString(fmt.Sprintf("【文档%d】%s（分类：%s）\n%s\n\n", i+1, d.Title, d.Category, content))
	}
	return sb.String()
}

// buildFallbackAnswer LLM 不可用时的降级回答
func buildFallbackAnswer(docs []model.KnowledgeDoc) string {
	if len(docs) == 0 {
		return "抱歉，知识库中未找到与问题相关的内容。建议尝试更具体的关键词，例如“加固流程”“材料配比”“案例复盘”。"
	}
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("根据知识库搜索，找到 %d 篇相关文档：\n\n", len(docs)))
	for i, d := range docs {
		excerpt := d.Content
		if len(excerpt) > 200 {
			excerpt = excerpt[:200] + "..."
		}
		sb.WriteString(fmt.Sprintf("**[%d] %s**\n%s\n\n", i+1, d.Title, excerpt))
	}
	sb.WriteString("_（当前为知识库检索摘要，可继续追问以缩小范围）_")
	return sb.String()
}

func streamByChunks(text string, onToken func(delta string) error) error {
	runes := []rune(text)
	const chunkSize = 18
	for i := 0; i < len(runes); i += chunkSize {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		if err := onToken(string(runes[i:end])); err != nil {
			return err
		}
	}
	return nil
}

// OpenAI 兼容 API 请求/响应结构
type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
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

type chatStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		Message chatMessage `json:"message"`
	} `json:"choices"`
}

var citationPattern = regexp.MustCompile(`\[(\d{1,3})\]`)

func (s *KnowledgeQAService) callSmallTalkLLM(question string) (string, error) {
	systemPrompt := `你是北齐壁画修复系统助手。用户当前是寒暄或简单闲聊。
要求：
1. 使用中文回答
2. 1-2 句话，简短自然
3. 适度引导用户继续提问壁画修复相关问题
4. 不要输出来源引用序号`

	body, err := json.Marshal(chatRequest{
		Model:       s.llmCfg.Model,
		Temperature: 0.3,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: strings.TrimSpace(question)},
		},
	})
	if err != nil {
		return "", fmt.Errorf("序列化寒暄请求失败: %w", err)
	}

	url := strings.TrimRight(s.llmCfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("创建寒暄请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.llmCfg.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求寒暄失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("寒暄接口返回 %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("解析寒暄响应失败: %w", err)
	}
	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("寒暄接口返回空结果")
	}
	return chatResp.Choices[0].Message.Content, nil
}

func (s *KnowledgeQAService) callSmallTalkLLMStream(question string, onToken func(delta string) error) (string, bool, error) {
	systemPrompt := `你是北齐壁画修复系统助手。用户当前是寒暄或简单闲聊。
要求：
1. 使用中文回答
2. 1-2 句话，简短自然
3. 适度引导用户继续提问壁画修复相关问题
4. 不要输出来源引用序号`

	body, err := json.Marshal(chatRequest{
		Model:       s.llmCfg.Model,
		Temperature: 0.3,
		Stream:      true,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: strings.TrimSpace(question)},
		},
	})
	if err != nil {
		return "", false, fmt.Errorf("序列化寒暄流式请求失败: %w", err)
	}

	url := strings.TrimRight(s.llmCfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", false, fmt.Errorf("创建寒暄流式请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.llmCfg.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", false, fmt.Errorf("请求寒暄流失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", false, fmt.Errorf("寒暄流返回 %d: %s", resp.StatusCode, string(respBody))
	}

	var sb strings.Builder
	streamed := false

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 2*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}

		payload := line
		if strings.HasPrefix(line, "data:") {
			payload = strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		}
		if payload == "" {
			continue
		}
		if payload == "[DONE]" {
			break
		}

		delta, err := parseStreamDelta(payload)
		if err != nil {
			return sb.String(), streamed, err
		}
		if delta == "" {
			continue
		}

		streamed = true
		sb.WriteString(delta)
		if err := onToken(delta); err != nil {
			return sb.String(), streamed, err
		}
	}
	if err := scanner.Err(); err != nil {
		return sb.String(), streamed, fmt.Errorf("读取寒暄流失败: %w", err)
	}

	return sb.String(), streamed, nil
}

func (s *KnowledgeQAService) callLLM(question, context string) (string, error) {
	systemPrompt := `你是北齐壁画修复系统的知识库助手。请根据以下知识库文档内容回答用户的问题。
要求：
1. 只根据提供的文档内容回答，不要编造信息
2. 如果文档中没有相关内容，请如实告知
3. 回答要专业、准确、简洁
4. 每个关键结论后必须标注来源序号，格式为 [1]、[2]（序号对应提供的文档编号）
5. 使用中文回答`

	userPrompt := fmt.Sprintf("知识库文档：\n%s\n\n用户问题：%s", context, question)

	body, err := json.Marshal(chatRequest{
		Model:       s.llmCfg.Model,
		Temperature: 0.2,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	})
	if err != nil {
		return "", fmt.Errorf("序列化 LLM 请求失败: %w", err)
	}

	url := strings.TrimRight(s.llmCfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("创建 LLM 请求失败: %w", err)
	}
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

func (s *KnowledgeQAService) callLLMStream(question, context string, onToken func(delta string) error) (string, bool, error) {
	systemPrompt := `你是北齐壁画修复系统的知识库助手。请根据知识库文档回答问题。
要求：
1. 严格基于文档，不要编造
2. 回答简洁并给出可执行建议
3. 使用中文
4. 每个关键结论后标注来源序号，格式为 [1]、[2]（序号对应文档编号）`
	userPrompt := fmt.Sprintf("知识库文档：\n%s\n\n用户问题：%s", context, question)

	body, err := json.Marshal(chatRequest{
		Model:       s.llmCfg.Model,
		Temperature: 0.2,
		Stream:      true,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	})
	if err != nil {
		return "", false, fmt.Errorf("序列化 LLM 流式请求失败: %w", err)
	}

	url := strings.TrimRight(s.llmCfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", false, fmt.Errorf("创建 LLM 流式请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.llmCfg.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", false, fmt.Errorf("请求 LLM 流失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", false, fmt.Errorf("LLM 流返回 %d: %s", resp.StatusCode, string(respBody))
	}

	var sb strings.Builder
	streamed := false

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 2*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}

		payload := line
		if strings.HasPrefix(line, "data:") {
			payload = strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		}
		if payload == "" {
			continue
		}
		if payload == "[DONE]" {
			break
		}

		delta, err := parseStreamDelta(payload)
		if err != nil {
			return sb.String(), streamed, err
		}
		if delta == "" {
			continue
		}

		streamed = true
		sb.WriteString(delta)
		if err := onToken(delta); err != nil {
			return sb.String(), streamed, err
		}
	}
	if err := scanner.Err(); err != nil {
		return sb.String(), streamed, fmt.Errorf("读取 LLM 流失败: %w", err)
	}

	return sb.String(), streamed, nil
}

func parseStreamDelta(payload string) (string, error) {
	var chunk chatStreamResponse
	if err := json.Unmarshal([]byte(payload), &chunk); err != nil {
		return "", fmt.Errorf("解析 LLM 流分片失败: %w", err)
	}
	if len(chunk.Choices) == 0 {
		return "", nil
	}
	if chunk.Choices[0].Delta.Content != "" {
		return chunk.Choices[0].Delta.Content, nil
	}
	if chunk.Choices[0].Message.Content != "" {
		return chunk.Choices[0].Message.Content, nil
	}
	return "", nil
}

func normalizeAnswerCitations(answer string, sourceCount int) string {
	answer = strings.TrimSpace(answer)
	if answer == "" || sourceCount <= 0 {
		return answer
	}

	answer = citationPattern.ReplaceAllStringFunc(answer, func(token string) string {
		m := citationPattern.FindStringSubmatch(token)
		if len(m) < 2 {
			return token
		}
		n, err := strconv.Atoi(m[1])
		if err != nil || n < 1 || n > sourceCount {
			return "[1]"
		}
		return token
	})

	if !citationPattern.MatchString(answer) {
		answer += " [1]"
	}
	return answer
}
