import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Spin, Tag, Button, Modal } from 'antd';
import { RobotOutlined, SendOutlined, ClearOutlined, BookOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { askKnowledge, getKnowledgeDoc, type QAResult } from '@/api/knowledge';
import { DOC_CATEGORY_MAP } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDoc, DocCategory } from '@/types';

const categoryColors: Record<DocCategory, string> = {
  standard_process: '#5A6978', material_manual: '#6B9E6B', case_study: '#C9A66B', regulation: '#9C2F2F',
};

const SUGGESTED_QUESTIONS = [
  '壁画修复的标准流程是什么？',
  '常用的壁画加固材料有哪些？',
  '北齐壁画的主要病害类型？',
  '修复方案审批需要哪些条件？',
];

type QAMessage = { role: 'user' | 'assistant'; content: string; sources?: QAResult['sources'] };

export default function KnowledgeChatPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [qaInput, setQaInput] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDoc | null>(null);
  const qaEndRef = useRef<HTMLDivElement>(null);

  const sendQuestion = async (q: string) => {
    if (!q.trim() || qaLoading) return;
    setQaInput('');
    setQaMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQaLoading(true);
    setTimeout(() => qaEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await askKnowledge(q);
      setQaMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }]);
    } catch {
      setQaMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，问答服务暂时不可用，请稍后再试。' }]);
    } finally {
      setQaLoading(false);
      setTimeout(() => qaEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const openDetail = async (id: string) => {
    try { setDetailDoc(await getKnowledgeDoc(id)); } catch { /* 忽略 */ }
  };

  return (
    <div className="page-container w-full h-full flex flex-col">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-[clamp(8px,1.2vh,16px)] flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="page-title m-0">知识库</h2>
        </div>
        <div className="flex items-center gap-3">
          {qaMessages.length > 0 && (
            <Button icon={<ClearOutlined />} onClick={() => setQaMessages([])}>清空对话</Button>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex rounded-lg overflow-hidden border border-border-warm w-fit mb-3 shrink-0">
        <button
          className="px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 border-none cursor-pointer transition-all bg-white text-text-secondary hover:bg-bg-cream"
          onClick={() => navigate('/knowledge')}
        >
          <BookOutlined /> 文档库
        </button>
        <button className="px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 border-none cursor-pointer transition-all bg-primary text-white">
          <RobotOutlined /> 智能问答
        </button>
      </div>

      {/* 问答区 */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border-warm overflow-hidden" style={{ background: '#FFFDF9' }}>
        <div className="flex-1 overflow-auto p-5">
          {qaMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(139,58,47,0.1), rgba(201,166,107,0.15))' }}>
                <RobotOutlined className="text-3xl" style={{ color: '#8B3A2F' }} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">知识库智能问答</h3>
              <p className="text-sm text-text-secondary mb-6">基于知识库文档内容，为您解答壁画修复相关问题</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button key={q}
                    className="text-left px-4 py-3 rounded-lg border border-border-warm bg-white text-sm text-text-secondary hover:border-primary hover:text-primary cursor-pointer transition-all"
                    onClick={() => sendQuestion(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {qaMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-white' : ''
                  }`} style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, rgba(139,58,47,0.1), rgba(201,166,107,0.2))' } : undefined}>
                    {msg.role === 'user' ? user?.username?.[0]?.toUpperCase() || 'U' : <RobotOutlined style={{ color: '#8B3A2F' }} />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-bg-cream text-text-primary rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_p]:leading-relaxed [&_li]:my-0.5 [&_strong]:text-text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="text-xs mb-1.5" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#A89888' }}>
                          📚 参考来源
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s) => (
                            <span key={s.id}
                              className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors hover:opacity-80"
                              style={{ background: 'rgba(139,58,47,0.08)', color: '#8B3A2F' }}
                              onClick={() => openDetail(s.id)}>
                              {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {qaLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(139,58,47,0.1), rgba(201,166,107,0.2))' }}>
                    <RobotOutlined style={{ color: '#8B3A2F' }} />
                  </div>
                  <div className="bg-bg-cream rounded-xl rounded-tl-sm px-4 py-3 text-sm text-text-secondary">
                    <Spin size="small" className="mr-2" />正在检索知识库并生成回答...
                  </div>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-3 border-t border-border-warm bg-white">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Input size="large" placeholder="输入你的问题，如：壁画修复的标准流程是什么？"
              value={qaInput} onChange={(e) => setQaInput(e.target.value)}
              onPressEnter={() => sendQuestion(qaInput)} disabled={qaLoading} className="!rounded-lg" />
            <Button type="primary" size="large" icon={<SendOutlined />}
              disabled={!qaInput.trim() || qaLoading} onClick={() => sendQuestion(qaInput)}
              className="!rounded-lg" style={{ background: '#8B3A2F', border: 'none' }} />
          </div>
        </div>
      </div>

      {/* 文档详情弹窗（从引用来源点击打开） */}
      <Modal title={detailDoc?.title} open={!!detailDoc} onCancel={() => setDetailDoc(null)} footer={null} width={720}>
        {detailDoc && (
          <div>
            <Tag color={categoryColors[detailDoc.category]} className="mb-3">{DOC_CATEGORY_MAP[detailDoc.category]}</Tag>
            <div className="prose max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{detailDoc.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
