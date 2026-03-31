import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Spin, message } from 'antd';
import { createProject } from '@/api/project';
import { getMurals } from '@/api/mural';
import type { MuralRecord, Project } from '@/types';

interface Props {
  open: boolean;
  editingProject?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectFormModal({ open, editingProject, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [muralLoading, setMuralLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMuralLoading(true);
    getMurals({ pageSize: 200 })
      .then((res) => setMurals(res.data))
      .catch(() => {})
      .finally(() => setMuralLoading(false));
  }, [open]);

  // 编辑模式预填
  useEffect(() => {
    if (open && editingProject) {
      form.setFieldsValue({
        name: editingProject.name,
        description: editingProject.description,
        budget: editingProject.budget,
      });
    }
  }, [open, editingProject, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      // 目前后端只有 create，没有 update 接口
      await createProject(values);
      message.success('项目创建成功');
      onSuccess();
      onClose();
      form.resetFields();
    } catch { message.error('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={editingProject ? '编辑项目' : '新建修复项目'}
      open={open} onOk={handleSubmit} onCancel={onClose}
      confirmLoading={loading} destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input placeholder="如：徐显秀墓仪仗图修复项目" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="项目描述..." />
        </Form.Item>
        <Form.Item name="budget" label="预算（元）">
          <InputNumber min={0} className="!w-full" placeholder="项目预算" />
        </Form.Item>
        {!editingProject && (
          <Form.Item name="muralIds" label="关联壁画">
            <Select
              mode="multiple" placeholder="选择要关联的壁画" allowClear
              loading={muralLoading}
              notFoundContent={muralLoading ? <Spin size="small" /> : '暂无壁画'}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={murals.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
