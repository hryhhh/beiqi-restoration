import { useState } from 'react';
import { List, Tag, Button, Popconfirm, Select, InputNumber, Empty, Spin, Modal, Timeline, message } from 'antd';
import { DeleteOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import { DAMAGE_TYPE_MAP, SEVERITY_OPTIONS } from '@/constants';
import { getAnnotationVersions } from '@/api/annotation';
import type { DamageAnnotation, DamageType, AnnotationSnapshot } from '@/types';

interface Props {
  muralId: string;
  annotations: DamageAnnotation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, data: { damageType?: DamageType; severity?: number }) => void;
  onDelete: (id: string) => void;
}

/** 标注列表侧边面板 */
export default function AnnotationPanel({
  muralId, annotations, loading, selectedId, onSelect, onUpdate, onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [versions, setVersions] = useState<AnnotationSnapshot[]>([]);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);

  const showVersions = async (annoId: string) => {
    setVersionLoading(true);
    setVersionOpen(true);
    try {
      const res = await getAnnotationVersions(muralId, annoId);
      setVersions(res || []);
    } catch { message.error('加载版本历史失败'); setVersions([]); }
    finally { setVersionLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spin /></div>;
  if (!annotations.length) return <Empty description="暂无标注" className="py-8" />;

  return (
    <>
      <List
        size="small"
        dataSource={annotations}
        renderItem={(anno) => {
          const info = DAMAGE_TYPE_MAP[anno.damageType];
          const isSelected = anno.id === selectedId;
          const isEditing = anno.id === editingId;

          return (
            <List.Item
              className={`cursor-pointer transition-colors !px-3 ${isSelected ? '!bg-primary/5 border-l-2 !border-l-primary' : 'hover:!bg-gray-50'}`}
              onClick={() => onSelect(isSelected ? null : anno.id)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <Tag color={isSelected ? '#8B2E2E' : 'default'}>{info?.label || anno.damageType}</Tag>
                    <Tag>{info?.category}</Tag>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button type="text" size="small" icon={<HistoryOutlined />}
                      title="版本历史" onClick={() => showVersions(anno.id)} />
                    <Button type="text" size="small" icon={<EditOutlined />}
                      onClick={() => setEditingId(isEditing ? null : anno.id)} />
                    <Popconfirm title="确定删除此标注？" onConfirm={() => onDelete(anno.id)}>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>

                <div className="text-xs text-text-secondary mt-1">
                  严重程度：{SEVERITY_OPTIONS.find((s) => s.value === anno.severity)?.label || anno.severity}
                  {anno.areaPercent != null && ` · 面积 ${anno.areaPercent.toFixed(2)}%`}
                  {anno.version > 1 && <span className="ml-1 text-text-light">v{anno.version}</span>}
                </div>

                {anno.description && (
                  <div className="text-xs text-text-secondary mt-1 truncate">{anno.description}</div>
                )}

                {/* 内联编辑 */}
                {isEditing && (
                  <div className="mt-2 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    <Select
                      size="small" defaultValue={anno.damageType} className="!w-28"
                      options={Object.entries(DAMAGE_TYPE_MAP).map(([v, d]) => ({ value: v, label: d.label }))}
                      onChange={(v) => { onUpdate(anno.id, { damageType: v as DamageType }); setEditingId(null); }}
                    />
                    <InputNumber
                      size="small" min={1} max={5} defaultValue={anno.severity} className="!w-16"
                      onChange={(v) => { if (v) { onUpdate(anno.id, { severity: v }); setEditingId(null); } }}
                    />
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />

      {/* 版本历史弹窗 */}
      <Modal title="标注版本历史" open={versionOpen} onCancel={() => setVersionOpen(false)}
        footer={null} width={480}>
        <Spin spinning={versionLoading}>
          {versions.length ? (
            <Timeline className="mt-4"
              items={versions.map((v) => ({
                children: (
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <Tag>v{v.version}</Tag>
                      <Tag color="blue">{DAMAGE_TYPE_MAP[v.damageType]?.label || v.damageType}</Tag>
                      <span className="text-text-secondary">严重程度 {v.severity}</span>
                    </div>
                    <div className="text-xs text-text-light mt-1">
                      {new Date(v.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无历史版本" />
          )}
        </Spin>
      </Modal>
    </>
  );
}
