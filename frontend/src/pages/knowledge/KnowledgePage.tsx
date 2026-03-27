import { useEffect, useState } from 'react';
import { Input, Segmented, Card, Empty, Spin, Tag, Button, Modal, Form, Select, message, Pagination } from 'antd';
import { SearchOutlined, PlusOutlined, BookOutlined } from '@ant-design/icons';
import { getKnowledgeDocs, searchKnowledge, getKnowledgeDoc, createKnowledgeDoc } from '@/api/knowledge';
import { DOC_CATEGORY_MAP } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDoc, DocCategory } from '@/types';

const categoryColors: Record<DocCategory, string> = {
  standard_process: 'blue', material_manual: 'green', case_study: 'orange', regulation: 'red',
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [searchMode, setSearchMode] = useState(false);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDoc | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeDocs({ category: category || undefined, page, pageSize: 12 });
      setDocs(res.data);
      setTotal(res.total);
      setSearchMode(false);
    } catch { message.error('加载文档失败'); }
    finally { setLoading(false); }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) { loadDocs(); return; }
    setLoading(true);
    try {
      const res = await searchKnowledge(q);
      setDocs(res || []);
      setTotal(res?.length || 0);
      setSearchMode(true);
    } catch { message.error('搜索失败'); }
    finally { setLoading(false); }
  };

  const openDetail = async (id: string) => {
    try {
      setDetailDoc(await getKnowledgeDoc(id));
    } catch { message.error('加载文档详情失败'); }
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await createKnowledgeDoc(values);
      message.success('文档已创建');
      setCreateOpen(false);
      form.resetFields();
      loadDocs();
    } catch { message.error('创建失败'); }
  };

  useEffect(() => { loadDocs(); }, [category, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold m-0">知识库</h2>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="搜索文档" allowClear className="!w-64"
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
          />
          {user?.role === 'admin' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              上传文档
            </Button>
          )}
        </div>
      </div>

      {/* 分类筛选 */}
      <Segmented
        className="mb-4"
        value={category}
        options={[
          { value: '', label: '全部' },
          ...Object.entries(DOC_CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l })),
        ]}
        onChange={(v) => { setCategory(v as string); setPage(1); }}
      />

      <Spin spinning={loading}>
        {docs.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => (
                <Card key={doc.id} hoverable onClick={() => openDetail(doc.id)} className="!cursor-pointer">
                  <div className="flex items-start gap-3">
                    <BookOutlined className="text-2xl text-primary mt-1" />
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
                <Pagination current={page} pageSize={12} total={total} onChange={setPage} showTotal={(t) => `共 ${t} 条`} />
              </div>
            )}
          </>
        ) : (
          <Empty description="暂无文档" />
        )}
      </Spin>

      {/* 文档详情弹窗 */}
      <Modal
        title={detailDoc?.title} open={!!detailDoc} onCancel={() => setDetailDoc(null)}
        footer={null} width={720}
      >
        {detailDoc && (
          <div>
            <Tag color={categoryColors[detailDoc.category]} className="mb-3">
              {DOC_CATEGORY_MAP[detailDoc.category]}
            </Tag>
            <div className="prose max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {detailDoc.content}
            </div>
          </div>
        )}
      </Modal>

      {/* 创建文档弹窗 */}
      <Modal title="上传文档" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)} destroyOnClose width={640}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="文档标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={Object.entries(DOC_CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={10} placeholder="支持 Markdown 格式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
