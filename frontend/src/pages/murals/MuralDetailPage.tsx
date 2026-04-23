import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin,
  Descriptions,
  Tag,
  Button,
  Timeline,
  Upload,
  message,
  Image,
  Tabs,
  Empty,
  Select,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  HistoryOutlined,
  PictureOutlined,
  BugOutlined,
  ApartmentOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getMural, getMuralHistory, uploadMuralImage, deleteMural, deleteMuralImage } from '@/api/mural';
import { MURAL_STATUS_MAP, IMAGE_TYPE_MAP } from '@/constants';
import MuralFormModal from './MuralFormModal';
import AnnotationCanvas from '@/components/annotation/AnnotationCanvas';
import AnnotationToolbar from '@/components/annotation/AnnotationToolbar';
import AnnotationPanel from '@/components/annotation/AnnotationPanel';
import DamageTypeModal from '@/components/annotation/DamageTypeModal';
import MuralAssetPanel from '@/components/mural/MuralAssetPanel';
import { useAnnotation } from '@/hooks/useAnnotation';
import type {
  MuralRecord,
  MuralHistory,
  MuralStatus,
  ImageType,
  AnnotationCoordinates,
} from '@/types';

function parseCoordinates(raw: AnnotationCoordinates | string | null | undefined): AnnotationCoordinates | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || !Array.isArray(parsed.points)) return null;
    return {
      type: parsed.type,
      points: parsed.points.map((point: number[]) => [point[0], point[1]]),
    };
  } catch {
    return null;
  }
}

function formatHistoryField(field: string) {
  const directMap: Record<string, string> = {
    name: '名称',
    era: '年代',
    site: '地点',
    material: '材质',
    description: '描述',
    tombLocation: '墓葬位置',
    popularIntroduction: '通俗化介绍',
    historicalBackground: '历史背景',
    artisticFeatures: '艺术特点',
    culturalSignificance: '文化意义',
    status: '状态',
    名称: '名称',
    年代: '年代',
    地点: '地点',
    材质: '材质',
    描述: '描述',
    墓葬位置: '墓葬位置',
    通俗化介绍: '通俗化介绍',
    历史背景: '历史背景',
    艺术特点: '艺术特点',
    文化意义: '文化意义',
    状态: '状态',
  };

  if (directMap[field]) return directMap[field];

  if (field.startsWith('image.')) {
    const [, layer] = field.split('.');
    return `${IMAGE_TYPE_MAP[layer as ImageType] || layer}图像`;
  }

  if (field.startsWith('annotation.')) {
    const [, layer] = field.split('.');
    return `${IMAGE_TYPE_MAP[layer as ImageType] || layer}标注`;
  }

  if (field === 'asset.model') return '3D资源';
  if (field === 'asset.panorama') return '全景资源';
  if (field === 'asset.model.default') return '默认3D资源';
  if (field === 'asset.panorama.default') return '默认全景资源';

  return field;
}

function formatHistoryValue(field: string, value?: string | null) {
  if (!value) return null;
  if ((field === 'status' || field === '状态') && value in MURAL_STATUS_MAP) {
    return MURAL_STATUS_MAP[value as MuralStatus];
  }
  return value;
}

export default function MuralDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mural, setMural] = useState<MuralRecord | null>(null);
  const [history, setHistory] = useState<MuralHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [uploadType, setUploadType] = useState<ImageType>('visible');
  const [pendingCoords, setPendingCoords] = useState<AnnotationCoordinates | null>(null);
  const [geometryEditMode, setGeometryEditMode] = useState(false);
  const [geometryDirty, setGeometryDirty] = useState(false);
  const [geometryDraft, setGeometryDraft] = useState<AnnotationCoordinates | null>(null);

  const anno = useAnnotation(id || '');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [m, h] = await Promise.all([getMural(id), getMuralHistory(id)]);
      setMural(m);
      setHistory(h || []);
    } catch {
      message.error('加载壁画详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const layers = mural ? [...new Set(mural.images.map((img) => img.imageType))] as ImageType[] : [];
  const layerSignature = layers.join('|');
  const selectedAnnotation = anno.annotations.find((item) => item.id === anno.selected) || null;
  const canEditGeometry = !!selectedAnnotation && !anno.drawMode;

  useEffect(() => {
    if (!mural || activeTab !== 'annotations' || !layers.length) return;
    const targetLayer = layers.includes(anno.activeLayer) ? anno.activeLayer : layers[0];
    if (targetLayer !== anno.activeLayer) {
      anno.switchLayer(targetLayer);
      return;
    }
    void anno.fetchAnnotations(targetLayer);
  }, [mural, activeTab, layerSignature, anno.activeLayer, anno.fetchAnnotations, anno.switchLayer]);

  useEffect(() => {
    if (!geometryEditMode) return;
    if (!selectedAnnotation) {
      setGeometryEditMode(false);
      setGeometryDraft(null);
      setGeometryDirty(false);
      return;
    }
    const parsed = parseCoordinates(selectedAnnotation.coordinates);
    if (!parsed) {
      setGeometryEditMode(false);
      setGeometryDraft(null);
      setGeometryDirty(false);
      return;
    }
    setGeometryDraft(parsed);
    setGeometryDirty(false);
  }, [geometryEditMode, selectedAnnotation?.id]);

  useEffect(() => {
    if (activeTab !== 'annotations' && geometryEditMode) {
      setGeometryEditMode(false);
      setGeometryDraft(null);
      setGeometryDirty(false);
    }
  }, [activeTab, geometryEditMode]);

  useEffect(() => {
    if (!anno.drawMode || !geometryEditMode) return;
    setGeometryEditMode(false);
    setGeometryDraft(null);
    setGeometryDirty(false);
  }, [anno.drawMode, geometryEditMode]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!mural) return <Empty description="壁画不存在" />;

  const statusColor: Record<MuralStatus, string> = {
    registered: 'default',
    assessing: 'processing',
    restoring: 'warning',
    completed: 'success',
    monitoring: 'cyan',
  };

  const activeImage = mural.images.find((img) => img.imageType === anno.activeLayer) || mural.images[0];
  const severeCount = anno.annotations.filter((item) => item.severity >= 4).length;
  const describedCount = anno.annotations.filter((item) => item.description?.trim()).length;
  const showcaseFields = [
    { key: 'popularIntroduction', label: '通俗化介绍', value: mural.popularIntroduction },
    { key: 'historicalBackground', label: '历史背景', value: mural.historicalBackground },
    { key: 'artisticFeatures', label: '艺术特点', value: mural.artisticFeatures },
    { key: 'culturalSignificance', label: '文化意义', value: mural.culturalSignificance },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!mural) return <Empty description="壁画不存在" />;

  const startGeometryEdit = () => {
    if (!selectedAnnotation) return;
    const parsed = parseCoordinates(selectedAnnotation.coordinates);
    if (!parsed) {
      message.error('当前标注坐标无效，无法进入几何编辑');
      return;
    }
    anno.setDrawMode(null);
    setPendingCoords(null);
    setGeometryDraft(parsed);
    setGeometryDirty(false);
    setGeometryEditMode(true);
  };

  const cancelGeometryEdit = () => {
    setGeometryEditMode(false);
    setGeometryDraft(null);
    setGeometryDirty(false);
  };

  const saveGeometryEdit = async () => {
    if (!selectedAnnotation || !geometryDraft || !geometryDirty) return;
    await anno.editAnnotation(selectedAnnotation.id, { coordinates: geometryDraft });
    cancelGeometryEdit();
  };

  const handleDeleteMural = async () => {
    if (!id) return;
    try {
      await deleteMural(id);
      message.success('壁画已删除');
      navigate('/murals');
    } catch {
      message.error('删除失败');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    try {
      await deleteMuralImage(id, imageId);
      message.success('图像已删除');
      cancelGeometryEdit();
      anno.setSelected(null);
      await load();
    } catch (error: unknown) {
      const conflictMessage = typeof error === 'object'
        && error !== null
        && 'response' in error
        && typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '';
      message.error(conflictMessage || '删除失败');
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/murals')} />
          <h2 className="page-title m-0">{mural.name}</h2>
          <Tag color={statusColor[mural.status]}>{MURAL_STATUS_MAP[mural.status]}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这条壁画记录？"
            description="将同时删除关联图像、标注、方案和历史记录。"
            okText="删除"
            cancelText="取消"
            onConfirm={() => void handleDeleteMural()}
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>

      <Tabs
        className={activeTab === 'model' ? 'mural-detail-tabs mural-detail-tabs--model-active' : 'mural-detail-tabs'}
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'info',
            label: '基本信息',
            children: (
              <div className="space-y-4">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="年代">{mural.era}</Descriptions.Item>
                  <Descriptions.Item label="出土地点">{mural.site}</Descriptions.Item>
                  <Descriptions.Item label="材质">{mural.material}</Descriptions.Item>
                  <Descriptions.Item label="墓葬位置">{mural.tombLocation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="尺寸">{mural.dimensions || '-'}</Descriptions.Item>
                  <Descriptions.Item label="健康指数">
                    {mural.healthIndex != null ? `${mural.healthIndex}%` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="描述" span={2}>
                    {mural.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
                <div>
                  <div className="mb-3 text-sm font-medium text-[#8b3a2f]">修复成果信息</div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {showcaseFields.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-[#d9c6b4] bg-[rgba(255,248,238,0.78)] p-4"
                      >
                        <div className="mb-2 text-sm font-medium text-[#8b3a2f]">{item.label}</div>
                        <div className="min-h-20 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                          {item.value?.trim() || '暂无内容'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'images',
            label: (
              <span>
                <PictureOutlined className="mr-1" />
                图像库（{mural.images?.length || 0}）
              </span>
            ),
            children: (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Select
                    value={uploadType}
                    onChange={setUploadType}
                    style={{ width: 112 }}
                    options={Object.entries(IMAGE_TYPE_MAP).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={async ({ file, onSuccess, onError }) => {
                      try {
                        await uploadMuralImage(id!, file as File, uploadType);
                        message.success('上传成功');
                        onSuccess?.({});
                        await load();
                      } catch (error) {
                        onError?.(error as Error);
                        message.error('上传失败');
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>上传图像</Button>
                  </Upload>
                </div>

                {mural.images?.length ? (
                  <Image.PreviewGroup>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {mural.images.map((img) => (
                        <div key={img.id} className="border rounded overflow-hidden">
                          <div className="flex items-center justify-between border-b bg-[#fcfaf6] px-2 py-2">
                            <div className="text-xs text-text-secondary">
                              <Tag>{IMAGE_TYPE_MAP[img.imageType]}</Tag>
                              v{img.version}
                            </div>
                            <Popconfirm
                              title="确认删除这张图像？"
                              description="若这是该图层最后一张且已有标注，将禁止删除。"
                              okText="删除"
                              cancelText="取消"
                              onConfirm={() => void handleDeleteImage(img.id)}
                            >
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                          <Image
                            src={`/uploads/${img.filePath}`}
                            alt={`${mural.name} - ${IMAGE_TYPE_MAP[img.imageType]}`}
                            style={{ height: 160, objectFit: 'cover' }}
                            width="100%"
                          />
                          <div className="p-2 text-xs text-text-secondary">
                            尺寸 {img.width || '-'} × {img.height || '-'} · {Math.round(img.fileSize / 1024)} KB
                          </div>
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                ) : (
                  <Empty description="暂无图像" />
                )}
              </div>
            ),
          },
          {
            key: 'annotations',
            label: (
              <span>
                <BugOutlined className="mr-1" />
                病害标注
              </span>
            ),
            children: mural.images?.length ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3">
                    <div className="text-xs text-text-light">当前图层</div>
                    <div className="mt-1 text-lg font-semibold text-text-primary">
                      {IMAGE_TYPE_MAP[anno.activeLayer]}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      已载入 {anno.annotations.length} 条标注记录
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3">
                    <div className="text-xs text-text-light">高风险病害</div>
                    <div className="mt-1 text-lg font-semibold text-[#8B2E2E]">{severeCount} 处</div>
                    <div className="mt-1 text-xs text-text-secondary">
                      严重程度 4-5 级区域建议优先复核
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3">
                    <div className="text-xs text-text-light">记录完整度</div>
                    <div className="mt-1 text-lg font-semibold text-text-primary">{describedCount} / {anno.annotations.length || 0}</div>
                    <div className="mt-1 text-xs text-text-secondary">
                      已填写病害说明的标注数量
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3 text-sm text-text-secondary">
                  {selectedAnnotation ? (
                    <span>
                      当前选中：
                      <span className="mx-1 font-medium text-text-primary">
                        {IMAGE_TYPE_MAP[selectedAnnotation.imageLayer]}
                      </span>
                      ·
                      <span className="mx-1 font-medium text-text-primary">
                        {selectedAnnotation.id.slice(0, 8)}
                      </span>
                      · {selectedAnnotation.description || '尚未填写病害说明'}
                      {geometryEditMode && <span className="ml-2 text-[#8B2E2E]">· 正在进行几何编辑</span>}
                    </span>
                  ) : (
                    <span>未选中标注。可点击图像中的已标注区域查看详情，或使用工具栏新增标注。</span>
                  )}
                </div>

                <div className="flex gap-4 max-lg:flex-col" style={{ minHeight: 640 }}>
                  <div className="flex-1 flex flex-col border rounded overflow-hidden bg-white">
                    <AnnotationToolbar
                      drawMode={anno.drawMode}
                      activeLayer={anno.activeLayer}
                      layers={layers}
                      annotationCount={anno.annotations.length}
                      geometryEditMode={geometryEditMode}
                      geometryDirty={geometryDirty}
                      canEditGeometry={canEditGeometry}
                      onDrawModeChange={anno.setDrawMode}
                      onLayerChange={anno.switchLayer}
                      onRefresh={() => {
                        void anno.fetchAnnotations(anno.activeLayer);
                      }}
                      onGeometryEditToggle={startGeometryEdit}
                      onGeometrySave={() => {
                        void saveGeometryEdit();
                      }}
                      onGeometryCancel={cancelGeometryEdit}
                    />
                    <div className="flex-1">
                      <AnnotationCanvas
                        imageUrl={`/uploads/${activeImage.filePath}`}
                        annotations={anno.annotations}
                        drawMode={anno.drawMode}
                        pendingCoords={pendingCoords}
                        selectedId={anno.selected}
                        geometryEditMode={geometryEditMode}
                        editingAnnotationId={selectedAnnotation?.id || null}
                        geometryDraft={geometryDraft}
                        onGeometryDraftChange={(coords) => {
                          setGeometryDraft(coords);
                          setGeometryDirty(true);
                        }}
                        onSelect={anno.setSelected}
                        onDrawComplete={(coords) => setPendingCoords(coords)}
                      />
                    </div>
                  </div>

                  <div className="w-80 max-lg:w-full border rounded overflow-y-auto bg-white">
                    <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">
                      标注列表（{anno.annotations.length}）
                    </div>
                    <AnnotationPanel
                      muralId={id!}
                      annotations={anno.annotations}
                      loading={anno.loading}
                      selectedId={anno.selected}
                      onSelect={anno.setSelected}
                      onUpdate={(annotationId, data) => anno.editAnnotation(annotationId, data)}
                      onDelete={anno.removeAnnotation}
                    />
                  </div>

                  <DamageTypeModal
                    open={!!pendingCoords}
                    onConfirm={(damageType, severity, description) => {
                      if (pendingCoords) {
                        void anno.addAnnotation(pendingCoords, damageType, severity, description);
                        setPendingCoords(null);
                      }
                    }}
                    onCancel={() => setPendingCoords(null)}
                  />
                </div>
              </div>
            ) : (
              <Empty description="请先上传壁画图像" />
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined className="mr-1" />
                修改历史
              </span>
            ),
            children: history.length ? (
              <Timeline
                items={history.map((record) => ({
                  children: (
                    <div className="text-sm">
                      <span className="font-medium">修改字段：{formatHistoryField(record.field)}</span>
                      <div className="text-text-secondary mt-1">
                        {formatHistoryValue(record.field, record.oldValue) && (
                          <span className="line-through mr-2">
                            {formatHistoryValue(record.field, record.oldValue)}
                          </span>
                        )}
                        {formatHistoryValue(record.field, record.newValue) && (
                          <span className="text-primary">
                            {formatHistoryValue(record.field, record.newValue)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {new Date(record.changedAt).toLocaleString('zh-CN')} · {record.changedBy}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无修改记录" />
            ),
          },
          {
            key: 'model',
            label: (
              <span>
                <ApartmentOutlined className="mr-1" />
                3D模型/全景视图
              </span>
            ),
            children: (
              <Empty description="3D模型与全景视图功能正在接入中" />
            ),
          },
        ]}
      />

      {activeTab === 'model' && (
        <div className="mt-4">
          <MuralAssetPanel
            muralId={id!}
            assets={mural.assets || []}
            onChange={() => {
              void load();
            }}
          />
        </div>
      )}

      <MuralFormModal
        open={editOpen}
        mural={mural}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          void load();
        }}
      />
    </div>
  );
}
