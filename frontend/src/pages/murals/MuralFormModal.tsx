import { useState } from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import { createMural, updateMural } from '@/api/mural';
import { MURAL_STATUS_MAP } from '@/constants';
import type { MuralRecord } from '@/types';

interface Props {
  open: boolean;
  /** 传入则为编辑模式 */
  mural?: MuralRecord;
  onClose: () => void;
  onSuccess: () => void;
}

/** 壁画创建/编辑弹窗 */
export default function MuralFormModal({ open, mural, onClose, onSuccess }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!mural;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (isEdit) {
        await updateMural(mural!.id, values);
        message.success('更新成功');
      } else {
        await createMural(values);
        message.success('创建成功');
      }
      onSuccess();
      onClose();
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑壁画' : '新建壁画'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={mural ? {
          name: mural.name, era: mural.era, site: mural.site,
          material: mural.material, tombLocation: mural.tombLocation,
          dimensions: mural.dimensions, description: mural.description,
          status: mural.status, healthIndex: mural.healthIndex,
        } : { status: 'registered' }}
        className="mt-4"
      >
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入壁画名称' }]}>
          <Input placeholder="如：徐显秀墓仪仗图" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="era" label="年代" rules={[{ required: true, message: '请输入年代' }]}>
            <Input placeholder="如：北齐（550-577）" />
          </Form.Item>
          <Form.Item name="site" label="出土地点" rules={[{ required: true, message: '请输入出土地点' }]}>
            <Input placeholder="如：太原市迎泽区" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="material" label="材质" rules={[{ required: true, message: '请输入材质' }]}>
            <Input placeholder="如：石灰地仗" />
          </Form.Item>
          <Form.Item name="tombLocation" label="墓葬位置">
            <Input placeholder="如：墓室北壁" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="dimensions" label="尺寸">
            <Input placeholder="如：320×180cm" />
          </Form.Item>
          {isEdit && (
            <Form.Item name="status" label="状态">
              <Select options={Object.entries(MURAL_STATUS_MAP).map(([v, l]) => ({ value: v, label: l }))} />
            </Form.Item>
          )}
        </div>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="壁画内容描述..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
