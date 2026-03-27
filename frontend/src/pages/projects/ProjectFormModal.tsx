import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Spin, message } from 'antd';
import { createProject } from '@/api/project';
import { getMurals } from '@/api/mural';
import type { MuralRecord } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectFormModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [muralLoading, setMuralLoading] = useState(false);

  // 弹窗打开时加载壁画列表
  useEffect(() => {
    if (!open) return;
    setMuralLoading(true);
    getMurals({ pageSize: 200 })
      .then((res) => setMurals(res.data))
      .catch(() => {})
      .finally(() => setMuralLoading(false));
  }, [open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await createProject(values);
      message.success('项目创建成功');
      onSuccess();
      onClose();
      form.resetFields();
    } catch { message.error('创建失败'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="新建修复项目" open={open} onOk={handleSubmit} onCancel={onClose} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input placeholder="如：徐显秀墓仪仗图修复项目" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="项目描述..." />
        </Form.Item>
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
      </Form>
    </Modal>
  );
}
