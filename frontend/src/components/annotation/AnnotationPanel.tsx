import { useState } from 'react';
import {
  App,
  Button,
  Empty,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Tag,
  Timeline,
} from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getAnnotationVersions } from '@/api/annotation';
import { DAMAGE_TYPE_MAP, IMAGE_TYPE_MAP, SEVERITY_OPTIONS } from '@/constants';
import AnnotationGeometryPreview from './AnnotationGeometryPreview';
import type { AnnotationSnapshot, DamageAnnotation, DamageType } from '@/types';

interface Props {
  muralId: string;
  annotations: DamageAnnotation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, data: {
    damageType?: DamageType;
    severity?: number;
    description?: string;
  }) => Promise<void> | void;
  onDelete: (id: string) => void;
}

type DamageFilter = DamageType | 'all';
type SeverityFilter = number | 'all';

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN');
}

function severityLabel(value: number) {
  return SEVERITY_OPTIONS.find((item) => item.value === value)?.label || `${value}级`;
}

export default function AnnotationPanel({
  muralId,
  annotations,
  loading,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
}: Props) {
  const { message } = App.useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDamageType, setDraftDamageType] = useState<DamageType | null>(null);
  const [draftSeverity, setDraftSeverity] = useState<number>(3);
  const [draftDescription, setDraftDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [damageFilter, setDamageFilter] = useState<DamageFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [versions, setVersions] = useState<AnnotationSnapshot[]>([]);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);

  const selectedAnnotation = annotations.find((item) => item.id === selectedId) || null;

  const filteredAnnotations = annotations.filter((annotation) => {
    const info = DAMAGE_TYPE_MAP[annotation.damageType];
    const normalizedKeyword = keyword.trim().toLowerCase();
    const matchKeyword = !normalizedKeyword || [
      info?.label,
      info?.category,
      annotation.description,
      annotation.id,
    ].some((field) => field?.toLowerCase().includes(normalizedKeyword));
    const matchDamage = damageFilter === 'all' || annotation.damageType === damageFilter;
    const matchSeverity = severityFilter === 'all' || annotation.severity === severityFilter;
    return matchKeyword && matchDamage && matchSeverity;
  });

  const startEditing = (annotation: DamageAnnotation) => {
    setEditingId(annotation.id);
    setDraftDamageType(annotation.damageType);
    setDraftSeverity(annotation.severity);
    setDraftDescription(annotation.description || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftDamageType(null);
    setDraftSeverity(3);
    setDraftDescription('');
  };

  const saveEditing = async () => {
    if (!editingId || !draftDamageType) return;

    setSaving(true);
    try {
      await onUpdate(editingId, {
        damageType: draftDamageType,
        severity: draftSeverity,
        description: draftDescription.trim(),
      });
      cancelEditing();
    } finally {
      setSaving(false);
    }
  };

  const showVersions = async (annotationId: string) => {
    setVersionLoading(true);
    setVersionOpen(true);
    try {
      const result = await getAnnotationVersions(muralId, annotationId);
      setVersions(result || []);
    } catch {
      message.error('加载标注版本历史失败');
      setVersions([]);
    } finally {
      setVersionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Spin /></div>;
  }

  return (
    <>
      <div className="border-b bg-[#fcfaf6] p-3">
        <div className="grid grid-cols-1 gap-2">
          <Input
            allowClear
            size="small"
            value={keyword}
            prefix={<SearchOutlined />}
            placeholder="搜索病害类型、描述或标注编号"
            onChange={(event) => setKeyword(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              size="small"
              value={damageFilter}
              onChange={(value) => setDamageFilter(value as DamageFilter)}
              options={[
                { value: 'all', label: '全部病害' },
                ...Object.entries(DAMAGE_TYPE_MAP).map(([value, item]) => ({
                  value,
                  label: item.label,
                })),
              ]}
            />
            <Select
              size="small"
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value as SeverityFilter)}
              options={[
                { value: 'all', label: '全部等级' },
                ...SEVERITY_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
              ]}
            />
          </div>
        </div>
      </div>

      {selectedAnnotation && (
        <div className="m-3 rounded-xl border border-[#eadfce] bg-[#fffdf9] px-3 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-text-primary">当前选中标注</div>
                <Tag color="#8B2E2E">v{selectedAnnotation.version}</Tag>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color="processing">
                  {DAMAGE_TYPE_MAP[selectedAnnotation.damageType]?.label || selectedAnnotation.damageType}
                </Tag>
                <Tag>{DAMAGE_TYPE_MAP[selectedAnnotation.damageType]?.category}</Tag>
                <Tag>{IMAGE_TYPE_MAP[selectedAnnotation.imageLayer]}</Tag>
              </div>
              <div className="mt-2 text-xs leading-6 text-text-secondary">
                严重程度：{severityLabel(selectedAnnotation.severity)}
                {selectedAnnotation.areaPercent != null && ` · 面积占比 ${selectedAnnotation.areaPercent.toFixed(2)}%`}
              </div>
              <div className="text-xs leading-6 text-text-secondary">
                创建时间：{formatTime(selectedAnnotation.createdAt)}
              </div>
              <div className="text-xs leading-6 text-text-secondary">
                更新时间：{formatTime(selectedAnnotation.updatedAt)}
              </div>
              <div className="mt-2 text-xs leading-6 text-text-secondary">
                {selectedAnnotation.description || '暂无病害说明'}
              </div>
            </div>
            <AnnotationGeometryPreview
              coordinates={selectedAnnotation.coordinates}
              damageType={selectedAnnotation.damageType}
              selected
            />
          </div>
        </div>
      )}

      {!annotations.length ? (
        <Empty description="暂无标注" className="py-8" />
      ) : !filteredAnnotations.length ? (
        <Empty description="没有符合筛选条件的标注" className="py-8" />
      ) : (
        <List
          size="small"
          dataSource={filteredAnnotations}
          renderItem={(annotation) => {
            const info = DAMAGE_TYPE_MAP[annotation.damageType];
            const isSelected = annotation.id === selectedId;
            const isEditing = annotation.id === editingId;

            return (
              <List.Item
                className={`cursor-pointer items-start! px-3! py-3! transition-colors ${isSelected ? 'border-l-2 border-l-primary! bg-primary/5!' : 'hover:bg-gray-50!'}`}
                onClick={() => onSelect(isSelected ? null : annotation.id)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1">
                        <Tag color={isSelected ? '#8B2E2E' : 'default'}>
                          {info?.label || annotation.damageType}
                        </Tag>
                        <Tag>{info?.category}</Tag>
                        <Tag>{IMAGE_TYPE_MAP[annotation.imageLayer]}</Tag>
                      </div>
                      <div className="mt-1 text-xs text-text-secondary">
                        严重程度：{severityLabel(annotation.severity)}
                        {annotation.areaPercent != null && ` · 面积 ${annotation.areaPercent.toFixed(2)}%`}
                        {annotation.version > 1 && <span className="ml-1 text-text-light">v{annotation.version}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                      <Button
                        type="text"
                        size="small"
                        icon={<HistoryOutlined />}
                        title="版本历史"
                        onClick={() => {
                          void showVersions(annotation.id);
                        }}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => (isEditing ? cancelEditing() : startEditing(annotation))}
                      />
                      <Popconfirm title="确定删除此标注？" onConfirm={() => onDelete(annotation.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-3">
                    <AnnotationGeometryPreview
                      coordinates={annotation.coordinates}
                      damageType={annotation.damageType}
                      selected={isSelected}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-text-light">
                        标注编号：{annotation.id.slice(0, 8)} · 更新于 {formatTime(annotation.updatedAt)}
                      </div>

                      {annotation.description && !isEditing && (
                        <div className="mt-2 rounded-lg bg-[#faf6ef] px-2 py-2 text-xs leading-5 text-text-secondary">
                          {annotation.description}
                        </div>
                      )}

                      {isEditing && draftDamageType && (
                        <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                          <Select
                            size="small"
                            value={draftDamageType}
                            className="w-full!"
                            options={Object.entries(DAMAGE_TYPE_MAP).map(([value, item]) => ({
                              value,
                              label: `${item.label}（${item.category}）`,
                            }))}
                            onChange={(value) => setDraftDamageType(value as DamageType)}
                          />
                          <InputNumber
                            size="small"
                            min={1}
                            max={5}
                            value={draftSeverity}
                            className="w-full!"
                            onChange={(value) => {
                              if (typeof value === 'number') {
                                setDraftSeverity(value);
                              }
                            }}
                          />
                          <Input.TextArea
                            rows={3}
                            value={draftDescription}
                            placeholder="记录病害位置、形态或处理建议"
                            onChange={(event) => setDraftDescription(event.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="small" icon={<CloseOutlined />} onClick={cancelEditing}>
                              取消
                            </Button>
                            <Button
                              type="primary"
                              size="small"
                              loading={saving}
                              icon={<SaveOutlined />}
                              onClick={() => {
                                void saveEditing();
                              }}
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}

      <Modal
        title="标注版本历史"
        open={versionOpen}
        onCancel={() => setVersionOpen(false)}
        footer={null}
        width={520}
      >
        <Spin spinning={versionLoading}>
          {versions.length ? (
            <Timeline
              className="mt-4"
              items={versions.map((version) => ({
                children: (
                  <div className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag>v{version.version}</Tag>
                      <Tag color="blue">
                        {DAMAGE_TYPE_MAP[version.damageType]?.label || version.damageType}
                      </Tag>
                      <span className="text-text-secondary">严重程度 {version.severity}</span>
                    </div>
                    <div className="mt-1 text-xs text-text-light">
                      {formatTime(version.createdAt)}
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
