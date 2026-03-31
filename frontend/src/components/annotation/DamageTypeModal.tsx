import { useState } from 'react';
import { Modal, Form, Select, Input } from 'antd';
import { DAMAGE_TYPE_MAP, SEVERITY_OPTIONS } from '@/constants';
import type { DamageType } from '@/types';

interface Props {
  open: boolean;
  onConfirm: (damageType: DamageType, severity: number, description?: string) => void;
  onCancel: () => void;
}

/** 绘制完成后选择病害属性的弹窗 */
export default function DamageTypeModal({ open, onConfirm, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    onConfirm(values.damageType, values.severity, values.description);
    form.resetFields();
    setLoading(false);
  };

  return (
    <Modal
      title="标注属性"
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={loading}
      destroyOnClose
      width={400}
    >
      <Form form={form} layout="vertical" initialValues={{ severity: 3 }} className="mt-4">
        <Form.Item name="damageType" label="病害类型" rules={[{ required: true, message: '请选择病害类型' }]}>
          <Select
            placeholder="选择病害类型"
            options={Object.entries(DAMAGE_TYPE_MAP).map(([v, d]) => ({
              value: v, label: `${d.label}（${d.category}）`,
            }))}
          />
        </Form.Item>
        <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
          <Select options={SEVERITY_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="可选：描述病害情况" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
