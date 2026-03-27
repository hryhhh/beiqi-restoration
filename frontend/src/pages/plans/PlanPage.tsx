import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, Empty, Spin, message, Tabs,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { getPlans, getPlan, createPlan, updatePlanStatus, reviewPlan } from '@/api/plan';
import { PLAN_STATUS_MAP } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import ComparisonView from '@/components/comparison/ComparisonView';
import type { RestorationPlan, PlanStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const statusColor: Record<PlanStatus, string> = {
  draft: 'default', pending: 'orange', approved: 'green',
  rejected: 'red', in_progress: 'blue', completed: 'cyan',
};

export default function PlanPage() {
  const [searchParams] = useSearchParams();
  const annotationId = searchParams.get('annotationId') || undefined;
  const user = useAuthStore((s) => s.user);

  const [plans, setPlans] = useState<RestorationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState<RestorationPlan | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPlanId, setReviewPlanId] = useState('');
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { setPlans(await getPlans(annotationId) || []); }
    catch { message.error('加载方案列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [annotationId]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await createPlan(values);
      message.success('方案已创建');
      setCreateOpen(false);
      form.resetFields();
      load();
    } catch { message.error('创建失败，请确认病害标注存在'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updatePlanStatus(id, status);
      message.success('状态已更新');
      load();
      if (detailPlan?.id === id) openDetail(id);
    } catch { message.error('更新失败'); }
  };

  const handleReview = async () => {
    const values = await reviewForm.validateFields();
    try {
      await reviewPlan(reviewPlanId, values);
      message.success('审批完成');
      setReviewOpen(false);
      reviewForm.resetFields();
      load();
    } catch { message.error('审批失败'); }
  };

  const openDetail = async (id: string) => {
    try { setDetailPlan(await getPlan(id)); }
    catch { message.error('加载方案详情失败'); }
  };

  const openReview = (id: string) => {
    setReviewPlanId(id);
    setReviewOpen(true);
  };

  const isReviewer = user?.role === 'reviewer';

  const columns: ColumnsType<RestorationPlan> = [
    { title: '修复方法', dataIndex: 'method', key: 'method', ellipsis: true },
    { title: '使用材料', dataIndex: 'materials', key: 'materials', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: PlanStatus) => <Tag color={statusColor[s]}>{PLAN_STATUS_MAP[s]}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    { title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <div className="flex gap-1">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>
            详情
          </Button>
          {isReviewer && r.status === 'pending' && (
            <Button type="link" size="small" onClick={() => openReview(r.id)}>审批</Button>
          )}
          {r.status === 'approved' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(r.id, 'in_progress')}>
              开始执行
            </Button>
          )}
          {r.status === 'in_progress' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(r.id, 'completed')}>
              标记完成
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold m-0">修复方案</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建方案
        </Button>
      </div>

      <Spin spinning={loading}>
        {plans.length ? (
          <Table rowKey="id" columns={columns} dataSource={plans} pagination={false} />
        ) : (
          <Empty description="暂无修复方案" />
        )}
      </Spin>

      {/* 创建方案弹窗 */}
      <Modal title="新建修复方案" open={createOpen} onOk={handleCreate}
        onCancel={() => setCreateOpen(false)} destroyOnClose width={560}>
        <Form form={form} layout="vertical" className="mt-4"
          initialValues={{ annotationId: annotationId || '' }}>
          <Form.Item name="annotationId" label="关联病害标注 ID" rules={[{ required: true, message: '请输入病害标注 ID' }]}>
            <Input placeholder="病害标注 ID" />
          </Form.Item>
          <Form.Item name="method" label="修复方法" rules={[{ required: true, message: '请输入修复方法' }]}>
            <Input.TextArea rows={3} placeholder="如：采用注射灌浆法处理空鼓区域，使用改性环氧树脂..." />
          </Form.Item>
          <Form.Item name="materials" label="使用材料" rules={[{ required: true, message: '请输入使用材料' }]}>
            <Input.TextArea rows={2} placeholder="如：改性环氧树脂、丙烯酸乳液、矿物颜料..." />
          </Form.Item>
          <Form.Item name="expectedResult" label="预期效果">
            <Input.TextArea rows={2} placeholder="预期修复效果描述..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 方案详情弹窗 */}
      <Modal
        title="方案详情" open={!!detailPlan} onCancel={() => setDetailPlan(null)}
        footer={null} width={800} destroyOnClose
      >
        {detailPlan && (
          <Tabs items={[
            {
              key: 'info',
              label: '方案信息',
              children: (
                <div className="space-y-4">
                  <Card size="small" title="基本信息">
                    <div className="space-y-2 text-sm">
                      <div><span className="text-text-secondary">状态：</span>
                        <Tag color={statusColor[detailPlan.status]}>{PLAN_STATUS_MAP[detailPlan.status]}</Tag>
                      </div>
                      <div><span className="text-text-secondary">修复方法：</span>{detailPlan.method}</div>
                      <div><span className="text-text-secondary">使用材料：</span>{detailPlan.materials}</div>
                      {detailPlan.expectedResult && (
                        <div><span className="text-text-secondary">预期效果：</span>{detailPlan.expectedResult}</div>
                      )}
                    </div>
                  </Card>

                  {/* 审批记录 */}
                  {detailPlan.reviews?.length ? (
                    <Card size="small" title="审批记录">
                      {detailPlan.reviews.map((r) => (
                        <div key={r.id} className="flex items-start gap-2 mb-2 text-sm">
                          {r.result === 'approved'
                            ? <CheckCircleOutlined className="text-green-500 mt-0.5" />
                            : <CloseCircleOutlined className="text-red-500 mt-0.5" />}
                          <div>
                            <Tag color={r.result === 'approved' ? 'green' : 'red'}>
                              {r.result === 'approved' ? '通过' : '驳回'}
                            </Tag>
                            {r.comment && <span className="text-text-secondary ml-1">{r.comment}</span>}
                            <div className="text-xs text-text-secondary mt-1">
                              {new Date(r.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </Card>
                  ) : null}

                  {/* 状态变更历史 */}
                  {detailPlan.statusChanges?.length ? (
                    <Card size="small" title="状态变更">
                      {detailPlan.statusChanges.map((sc) => (
                        <div key={sc.id} className="text-sm mb-1">
                          <Tag>{PLAN_STATUS_MAP[sc.fromStatus]}</Tag>
                          →
                          <Tag>{PLAN_STATUS_MAP[sc.toStatus]}</Tag>
                          <span className="text-xs text-text-secondary ml-2">
                            {new Date(sc.changedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </Card>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'compare',
              label: '修复对比',
              children: (
                <ComparisonView
                  /* 实际使用时从壁画图像中获取修复前后图 */
                  beforeSrc={undefined}
                  afterSrc={undefined}
                />
              ),
            },
          ]} />
        )}
      </Modal>

      {/* 审批弹窗 */}
      <Modal title="审批修复方案" open={reviewOpen} onOk={handleReview}
        onCancel={() => setReviewOpen(false)} destroyOnClose>
        <Form form={reviewForm} layout="vertical" className="mt-4">
          <Form.Item name="result" label="审批结果" rules={[{ required: true, message: '请选择审批结果' }]}>
            <Select
              placeholder="选择审批结果"
              options={[
                { value: 'approved', label: '✅ 通过' },
                { value: 'rejected', label: '❌ 驳回' },
              ]}
            />
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={3} placeholder="审批意见（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
