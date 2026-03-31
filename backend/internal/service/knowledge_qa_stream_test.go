package service

import (
	"strings"
	"testing"

	"github.com/hry/beiqi-mural-guardian/backend/internal/config"
)

func TestParseStreamDelta_WithDelta(t *testing.T) {
	payload := `{"choices":[{"delta":{"content":"你好"}}]}`
	got, err := parseStreamDelta(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "你好" {
		t.Fatalf("expected 你好, got %q", got)
	}
}

func TestParseStreamDelta_WithMessageFallback(t *testing.T) {
	payload := `{"choices":[{"message":{"role":"assistant","content":"完整答案"}}]}`
	got, err := parseStreamDelta(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "完整答案" {
		t.Fatalf("expected 完整答案, got %q", got)
	}
}

func TestNormalizeAnswerCitations_OutOfRangeFallbackToOne(t *testing.T) {
	answer := "修复步骤参考[99]，并结合工艺要求[2]。"
	got := normalizeAnswerCitations(answer, 3)
	want := "修复步骤参考[1]，并结合工艺要求[2]。"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestNormalizeAnswerCitations_AppendDefaultWhenMissing(t *testing.T) {
	answer := "建议先完成病害评估再制定方案。"
	got := normalizeAnswerCitations(answer, 2)
	want := "建议先完成病害评估再制定方案。 [1]"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestNormalizeAnswerCitations_KeepUnchangedWhenNoSources(t *testing.T) {
	answer := "知识库暂无相关条目。"
	got := normalizeAnswerCitations(answer, 0)
	if got != answer {
		t.Fatalf("expected %q, got %q", answer, got)
	}
}

func TestBuildSmallTalkAnswer_Greeting(t *testing.T) {
	got, ok := buildSmallTalkAnswer("hi!")
	if !ok {
		t.Fatalf("expected small talk to be detected")
	}
	if got == "" {
		t.Fatalf("expected non-empty answer")
	}
}

func TestBuildSmallTalkAnswer_Thanks(t *testing.T) {
	got, ok := buildSmallTalkAnswer("谢谢你")
	if !ok {
		t.Fatalf("expected thanks to be detected")
	}
	if got == "" {
		t.Fatalf("expected non-empty answer")
	}
}

func TestBuildSmallTalkAnswer_Farewell(t *testing.T) {
	got, ok := buildSmallTalkAnswer("再见")
	if !ok {
		t.Fatalf("expected farewell to be detected")
	}
	if got != "好的，随时欢迎再来提问。" {
		t.Fatalf("unexpected answer: %q", got)
	}
}

func TestBuildSmallTalkAnswer_NotSmallTalk(t *testing.T) {
	_, ok := buildSmallTalkAnswer("壁画修复的标准流程是什么")
	if ok {
		t.Fatalf("expected non-small-talk question not to be detected")
	}
}

func TestAsk_SmallTalk_LocalFallbackWhenLLMUnavailable(t *testing.T) {
	svc := NewKnowledgeQAService(nil, &config.LLMConfig{})
	res, err := svc.Ask("hi")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res == nil {
		t.Fatalf("expected result")
	}
	if res.Note != "small_talk" || res.Mode != QAModeFallback {
		t.Fatalf("unexpected mode/note: mode=%s note=%s", res.Mode, res.Note)
	}
	if strings.TrimSpace(res.Answer) == "" {
		t.Fatalf("expected non-empty answer")
	}
}

func TestAskStream_SmallTalk_LocalFallbackWhenLLMUnavailable(t *testing.T) {
	svc := NewKnowledgeQAService(nil, &config.LLMConfig{})
	var streamed strings.Builder
	res, err := svc.AskStream("你好", func(delta string) error {
		streamed.WriteString(delta)
		return nil
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res == nil {
		t.Fatalf("expected result")
	}
	if res.Note != "small_talk" || res.Mode != QAModeFallback {
		t.Fatalf("unexpected mode/note: mode=%s note=%s", res.Mode, res.Note)
	}
	if streamed.String() != res.Answer {
		t.Fatalf("expected streamed answer equal final answer, got streamed=%q final=%q", streamed.String(), res.Answer)
	}
}
