import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Input, Card, Empty, Spin, Tag, Button, Modal, Form, Select, App, Pagination, Popconfirm,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  FileTextOutlined, RobotOutlined, BookOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import {
  getKnowledgeDocs, searchKnowledge, getKnowledgeDoc,
  createKnowledgeDoc, updateKnowledgeDoc, deleteKnowledgeDoc,
} from '@/api/knowledge';
import { DOC_CATEGORY_MAP } from '@/constants';
import { MOCK_KNOWLEDGE_DOCS } from '@/mock';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDoc, DocCategory } from '@/types';

const categoryColors: Record<DocCategory, string> = {
  standard_process: '#5A6978', material_manual: '#6B9E6B', case_study: '#C9A66B', regulation: '#9C2F2F',
};

export default function KnowledgePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [searchMode, setSearchMode] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDoc | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeDocs({ category: category || undefined, page, pageSize: 12 });
      if (res.data?.length > 0) {
        setDocs(res.data); setTotal(res.total); setSearchMode(false); setIsMock(false);
      } else {
        const filtered = category ? MOCK_KNOWLEDGE_DOCS.filter((d) => d.category === category) : MOCK_KNOWLEDGE_DOCS;
        setDocs(filtered); setTotal(filtered.length); setSearchMode(false); setIsMock(true);
      }
    } catch {
      const filtered = category ? MOCK_KNOWLEDGE_DOCS.filter((d) => d.category === category) : MOCK_KNOWLEDGE_DOCS;
      setDocs(filtered); setTotal(filtered.length); setSearchMode(false); setIsMock(true);
    } finally { setLoading(false); }
  }, [category, page]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) { loadDocs(); return; }
    setLoading(true);
    try {
      const res = await searchKnowledge(q);
      if (res?.length) { setDocs(res); setTotal(res.length); setSearchMode(true); setIsMock(false); }
      else {
        const filtered = MOCK_KNOWLEDGE_DOCS.filter((d) => d.title.includes(q) || d.content.includes(q));
        setDocs(filtered); setTotal(filtered.length); setSearchMode(true); setIsMock(true);
      }
    } catch {
      const filtered = MOCK_KNOWLEDGE_DOCS.filter((d) => d.title.includes(q) || d.content.includes(q));
      setDocs(filtered); setTotal(filtered.length); setSearchMode(true); setIsMock(true);
    } finally { setLoading(false); }
  };

  const openDetail = async (id: string) => {
    try { setDetailDoc(await getKnowledgeDoc(id)); }
    catch {
      const mock = MOCK_KNOWLEDGE_DOCS.find((d) => d.id === id);
      if (mock) setDetailDoc(mock); else message.error('加载文档详情失败');
    }
  };

  const openForm = (doc?: KnowledgeDoc) => {
    setEditingDoc(doc || null);
    form.setFieldsValue(doc ? { title: doc.title, category: doc.category, content: doc.content } : {});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingDoc) { await updateKnowledgeDoc(editingDoc.id, values); message.success('文档已更新'); }
      else { await createKnowledgeDoc(values); message.success('文档已创建'); }
      setFormOpen(false); form.resetFields(); setEditingDoc(null); loadDocs();
    } catch { message.error(editingDoc ? '更新失败' : '创建失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteKnowledgeDoc(id); message.success('文档已删除'); loadDocs(); }
    catch { message.error('删除失败'); }
  };

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const categories = [
    { value: '', label: '全部' },
    ...Object.entries(DOC_CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l })),
  ];

  return (
    <div className="page-container w-full h-full flex flex-col">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-[clamp(8px,1.2vh,16px)] flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="page-title m-0">知识库</h2>
          {isMock && <Tag color="warning" className="text-xs">演示数据</Tag>}
        </div>
        <div className="flex items-center gap-3">
          <Input.Search placeholder="搜索文档" allowClear className="w-60!"
            prefix={<SearchOutlined />} onSearch={handleSearch} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}
              style={{ background: 'linear-gradient(135deg, #8B3A2F, #A85044)', border: 'none' }}>
              上传文档
            </Button>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex rounded-lg overflow-hidden border border-border-warm w-fit mb-3 shrink-0">
        <button className="px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 border-none cursor-pointer bg-primary text-white">
          <BookOutlined /> 文档库
        </button>
        <button
          className="px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 border-none cursor-pointer transition-all bg-white text-text-secondary hover:bg-bg-cream"
          onClick={() => navigate('/knowledge/chat')}
        >
          <RobotOutlined /> 智能问答
        </button>
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center gap-2 flex-wrap mb-4 shrink-0">
        {categories.map((c) => (
          <button key={c.value}
            onClick={() => { setCategory(c.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm border-none cursor-pointer transition-all ${
              category === c.value ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-bg-cream'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* 文档卡片 */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Spin spinning={loading}>
          {docs.length ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                  <Card key={doc.id} hoverable className="cursor-pointer!"
                    onClick={() => openDetail(doc.id)}
                    actions={isAdmin ? [
                      <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openForm(doc); }} />,
                      <Popconfirm key="del" title="确定删除该文档？"
                        onConfirm={(e) => { e?.stopPropagation(); handleDelete(doc.id); }}
                        onCancel={(e) => e?.stopPropagation()}>
                        <DeleteOutlined onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>,
                    ] : undefined}>
                    <div className="flex items-start gap-3">
                      <FileTextOutlined className="text-2xl mt-1" style={{ color: '#C9A66B' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-text-secondary mt-1">
                          <Tag color={categoryColors[doc.category]}>{DOC_CATEGORY_MAP[doc.category]}</Tag>
                          {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-xs text-text-secondary mt-2 line-clamp-2">
                          {doc.content?.slice(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {!searchMode && total > 12 && (
                <div className="flex justify-center mt-6">
                  <Pagination current={page} pageSize={12} total={total}
                    onChange={setPage} showTotal={(t) => `共 ${t} 条`} />
                </div>
              )}
            </>
          ) : (
            <Empty description="暂无文档" />
          )}
        </Spin>
      </div>

      {/* 文档详情弹窗 */}
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

      {/* 创建/编辑文档弹窗 */}
      <Modal title={editingDoc ? '编辑文档' : '上传文档'} open={formOpen} onOk={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingDoc(null); form.resetFields(); }}
        destroyOnHidden width={640}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入文档标题' }]}>
            <Input placeholder="文档标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={Object.entries(DOC_CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入文档内容' }]}>
            <Input.TextArea rows={10} placeholder="支持 Markdown 格式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
