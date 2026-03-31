import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Button, Tag, Tabs, Empty, message, Progress, Card, List, Popconfirm,
  Input, InputNumber, Form, Modal, Table, Select, Upload,
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, PlusOutlined,
  UserOutlined, PaperClipOutlined, UploadOutlined,
} from '@ant-design/icons';
import {
  getProject, completeProject, createTask, updateTask, addMaterial,
  assignTask, uploadAttachment,
} from '@/api/project';
import { getUsers } from '@/api/admin';
import { PROJECT_STATUS_MAP, TASK_STATUS_MAP, RESTORATION_PHASES } from '@/constants';
import type { Project, ProjectPhase, RestTask, ProjectStatus, TaskStatus, User } from '@/types';

const statusColor: Record<ProjectStatus, string> = {
  pending: 'default', in_progress: 'processing', completed: 'success',
};
const taskColor: Record<TaskStatus, string> = {
  pending: 'default', in_progress: 'processing', completed: 'success',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskPhaseId, setTaskPhaseId] = useState('');
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setProject(await getProject(id)); }
    catch { message.error('加载项目失败'); }
    finally { setLoading(false); }
  }, [id]);

  // 加载用户列表（用于任务分配）
  const loadUsers = async () => {
    if (users.length) return;
    try { setUsers(await getUsers()); } catch { /* 非管理员可能无权限 */ }
  };

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!project) return <Empty description="项目不存在" />;

  const handleComplete = async () => {
    try {
      await completeProject(id!);
      message.success('项目已标记完成');
      load();
    } catch { message.error('存在未完成的任务，无法完成项目'); }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTask(id!, taskId, status);
      message.success('任务状态已更新');
      load();
    } catch { message.error('更新失败'); }
  };

  const handleAddTask = async () => {
    const values = await taskForm.validateFields();
    try {
      await createTask(id!, { ...values, phaseId: taskPhaseId });
      message.success('任务已创建');
      setTaskModalOpen(false);
      taskForm.resetFields();
      load();
    } catch { message.error('创建失败'); }
  };

  const handleAddMaterial = async () => {
    const values = await materialForm.validateFields();
    try {
      await addMaterial(id!, values);
      message.success('材料记录已添加');
      setMaterialModalOpen(false);
      materialForm.resetFields();
      load();
    } catch { message.error('添加失败'); }
  };

  const openAssignModal = (task: RestTask) => {
    setAssignTaskId(task.id);
    setSelectedUserIds(task.assignees?.map((u) => u.id) || []);
    setAssignModalOpen(true);
    loadUsers();
  };

  const handleAssign = async () => {
    try {
      await assignTask(id!, assignTaskId, selectedUserIds);
      message.success('任务已分配');
      setAssignModalOpen(false);
      load();
    } catch { message.error('分配失败'); }
  };

  const handleUploadAttachment = async (taskId: string, file: File) => {
    try {
      await uploadAttachment(id!, taskId, file);
      message.success('附件已上传');
      load();
    } catch { message.error('上传失败'); }
  };

  /** 计算材料总费用 */
  const totalCost = project.materials?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;

  return (
    <div className="page-container">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
          <h2 className="page-title m-0">{project.name}</h2>
          <Tag color={statusColor[project.status]}>{PROJECT_STATUS_MAP[project.status]}</Tag>
          <Progress percent={project.progress} size="small" className="w-32! m-0!" />
        </div>
        {project.status !== 'completed' && (
          <Popconfirm title="确定标记项目为已完成？" onConfirm={handleComplete}>
            <Button type="primary" icon={<CheckCircleOutlined />}>完成项目</Button>
          </Popconfirm>
        )}
      </div>

      {project.description && <p className="text-text-secondary mb-4">{project.description}</p>}

      <Tabs items={[
        {
          key: 'phases',
          label: '修复流程',
          children: (
            <div className="space-y-4">
              {(project.phases || []).map((phase, idx) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  index={idx}
                  onTaskStatusChange={handleTaskStatusChange}
                  onAddTask={() => { setTaskPhaseId(phase.id); setTaskModalOpen(true); }}
                  onAssignTask={openAssignModal}
                  onUploadAttachment={handleUploadAttachment}
                />
              ))}
            </div>
          ),
        },
        {
          key: 'materials',
          label: `材料消耗（¥${totalCost.toLocaleString()}）`,
          children: (
            <div>
              <Button icon={<PlusOutlined />} onClick={() => setMaterialModalOpen(true)} className="mb-4">
                添加材料
              </Button>
              <Table
                rowKey="id" size="small"
                dataSource={project.materials || []}
                pagination={false}
                columns={[
                  { title: '材料名称', dataIndex: 'name' },
                  { title: '数量', dataIndex: 'quantity', width: 80 },
                  { title: '单位', dataIndex: 'unit', width: 80 },
                  { title: '费用', dataIndex: 'cost', width: 100,
                    render: (v?: number) => v != null ? `¥${v}` : '-' },
                  { title: '时间', dataIndex: 'createdAt', width: 180,
                    render: (v: string) => new Date(v).toLocaleString('zh-CN') },
                ]}
              />
            </div>
          ),
        },
      ]} />

      {/* 新建任务弹窗 */}
      <Modal title="新建任务" open={taskModalOpen} onOk={handleAddTask}
        onCancel={() => setTaskModalOpen(false)} destroyOnClose>
        <Form form={taskForm} layout="vertical" className="mt-4">
          <Form.Item name="title" label="任务标题" rules={[{ required: true }]}>
            <Input placeholder="任务标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加材料弹窗 */}
      <Modal title="添加材料消耗" open={materialModalOpen} onOk={handleAddMaterial}
        onCancel={() => setMaterialModalOpen(false)} destroyOnClose>
        <Form form={materialForm} layout="vertical" className="mt-4">
          <Form.Item name="name" label="材料名称" rules={[{ required: true }]}>
            <Input placeholder="如：丙烯酸树脂" />
          </Form.Item>
          <div className="grid grid-cols-3 gap-3">
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full!" />
            </Form.Item>
            <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
              <Input placeholder="ml" />
            </Form.Item>
            <Form.Item name="cost" label="费用（元）">
              <InputNumber min={0} className="w-full!" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 任务分配弹窗 */}
      <Modal title="分配任务" open={assignModalOpen} onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)} destroyOnClose>
        <Select
          mode="multiple" placeholder="选择负责人" className="w-full mt-4"
          value={selectedUserIds}
          onChange={setSelectedUserIds}
          options={users.map((u) => ({ value: u.id, label: `${u.username}（${u.role}）` }))}
        />
      </Modal>
    </div>
  );
}

/** 阶段卡片组件 */
function PhaseCard({ phase, index, onTaskStatusChange, onAddTask, onAssignTask, onUploadAttachment }: {
  phase: ProjectPhase; index: number;
  onTaskStatusChange: (taskId: string, status: string) => void;
  onAddTask: () => void;
  onAssignTask: (task: RestTask) => void;
  onUploadAttachment: (taskId: string, file: File) => void;
}) {
  const phaseLabel = RESTORATION_PHASES[index] || phase.name;

  return (
    <Card
      size="small"
      title={<span>{index + 1}. {phaseLabel}</span>}
      extra={<Button type="link" size="small" icon={<PlusOutlined />} onClick={onAddTask}>添加任务</Button>}
    >
      {phase.tasks?.length ? (
        <List
          size="small"
          dataSource={phase.tasks}
          renderItem={(task: RestTask) => (
            <List.Item
              actions={[
                <Button
                  key="assign" type="text" size="small" icon={<UserOutlined />}
                  onClick={() => onAssignTask(task)}
                  title="分配人员"
                />,
                <Upload
                  key="upload" showUploadList={false}
                  beforeUpload={(file) => { onUploadAttachment(task.id, file as File); return false; }}
                >
                  <Button type="text" size="small" icon={<UploadOutlined />} title="上传附件" />
                </Upload>,
                task.status !== 'completed' ? (
                  <Button
                    key="status" type="link" size="small"
                    onClick={() => onTaskStatusChange(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
                  >
                    {task.status === 'pending' ? '开始' : '完成'}
                  </Button>
                ) : null,
              ].filter(Boolean)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Tag color={taskColor[task.status]}>{TASK_STATUS_MAP[task.status]}</Tag>
                <span className="truncate">{task.title}</span>
                {/* 已分配人员标签 */}
                {task.assignees?.map((u) => (
                  <Tag key={u.id} icon={<UserOutlined />} className="text-xs!">{u.username}</Tag>
                ))}
                {/* 附件数量 */}
                {(task.attachments?.length ?? 0) > 0 && (
                  <Tag icon={<PaperClipOutlined />} className="text-xs!">{task.attachments!.length}</Tag>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div className="text-text-secondary text-sm py-2">暂无任务</div>
      )}
    </Card>
  );
}
