import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Descriptions, Tag, Button, Timeline, Upload, message, Image, Tabs, Empty, Select,
} from 'antd';
import {
  EditOutlined, ArrowLeftOutlined, UploadOutlined, HistoryOutlined, PictureOutlined, BugOutlined,
} from '@ant-design/icons';
import { getMural, getMuralHistory, uploadMuralImage } from '@/api/mural';
import { MURAL_STATUS_MAP, IMAGE_TYPE_MAP } from '@/constants';
import MuralFormModal from './MuralFormModal';
import AnnotationCanvas from '@/components/annotation/AnnotationCanvas';
import AnnotationToolbar from '@/components/annotation/AnnotationToolbar';
import AnnotationPanel from '@/components/annotation/AnnotationPanel';
import DamageTypeModal from '@/components/annotation/DamageTypeModal';
import { useAnnotation } from '@/hooks/useAnnotation';
import type { MuralRecord, MuralHistory, MuralStatus, ImageType, AnnotationCoordinates } from '@/types';

export default function MuralDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mural, setMural] = useState<MuralRecord | null>(null);
  const [history, setHistory] = useState<MuralHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ImageType>('visible');
  const [pendingCoords, setPendingCoords] = useState<AnnotationCoordinates | null>(null);

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

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!mural) return <Empty description="壁画不存在" />;

  const statusColor: Record<MuralStatus, string> = {
    registered: 'default', assessing: 'processing', restoring: 'warning',
    completed: 'success', monitoring: 'cyan',
  };

  return (
    <div className="page-container">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/murals')} />
          <h2 className="page-title m-0">{mural.name}</h2>
          <Tag color={statusColor[mural.status]}>{MURAL_STATUS_MAP[mural.status]}</Tag>
        </div>
        <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
      </div>

      <Tabs
        onChange={(key) => { if (key === 'annotations') anno.fetchAnnotations(); }}
        items={[
        {
          key: 'info',
          label: '基本信息',
          children: (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="年代">{mural.era}</Descriptions.Item>
              <Descriptions.Item label="出土地点">{mural.site}</Descriptions.Item>
              <Descriptions.Item label="材质">{mural.material}</Descriptions.Item>
              <Descriptions.Item label="墓葬位置">{mural.tombLocation || '-'}</Descriptions.Item>
              <Descriptions.Item label="尺寸">{mural.dimensions || '-'}</Descriptions.Item>
              <Descriptions.Item label="健康指数">
                {mural.healthIndex != null ? `${mural.healthIndex}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{mural.description || '-'}</Descriptions.Item>
            </Descriptions>
          ),
        },
        {
          key: 'images',
          label: <span><PictureOutlined className="mr-1" />图像库（{mural.images?.length || 0}）</span>,
          children: (
            <div>
              {/* 上传区 */}
              <div className="flex items-center gap-3 mb-4">
                <Select
                  value={uploadType}
                  onChange={setUploadType}
                  className="w-28!"
                  options={Object.entries(IMAGE_TYPE_MAP).map(([v, l]) => ({ value: v, label: l }))}
                />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={async ({ file }) => {
                    try {
                      await uploadMuralImage(id!, file as File, uploadType);
                      message.success('上传成功');
                      load();
                    } catch {
                      message.error('上传失败');
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>上传图像</Button>
                </Upload>
              </div>
              {/* 图像列表 */}
              {mural.images?.length ? (
                <Image.PreviewGroup>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mural.images.map((img) => (
                      <div key={img.id} className="border rounded overflow-hidden">
                        <Image
                          src={`/api/uploads/${img.filePath}`}
                          alt={`${mural.name} - ${IMAGE_TYPE_MAP[img.imageType]}`}
                          className="h-40! object-cover"
                          width="100%"
                        />
                        <div className="p-2 text-xs text-text-secondary">
                          <Tag>{IMAGE_TYPE_MAP[img.imageType]}</Tag>
                          v{img.version}
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
          label: <span><BugOutlined className="mr-1" />病害标注</span>,
          children: mural.images?.length ? (
            <div className="flex gap-4" style={{ height: 600 }}>
              {/* 左侧：画布 + 工具栏 */}
              <div className="flex-1 flex flex-col border rounded overflow-hidden">
                <AnnotationToolbar
                  drawMode={anno.drawMode}
                  activeLayer={anno.activeLayer}
                  layers={[...new Set(mural.images.map((img) => img.imageType))] as ImageType[]}
                  onDrawModeChange={anno.setDrawMode}
                  onLayerChange={anno.switchLayer}
                />
                <div className="flex-1">
                  <AnnotationCanvas
                    imageUrl={`/api/uploads/${(mural.images.find((img) => img.imageType === anno.activeLayer) || mural.images[0]).filePath}`}
                    annotations={anno.annotations}
                    drawMode={anno.drawMode}
                    selectedId={anno.selected}
                    onSelect={anno.setSelected}
                    onDrawComplete={(coords) => setPendingCoords(coords)}
                  />
                </div>
              </div>
              {/* 右侧：标注列表 */}
              <div className="w-72 border rounded overflow-y-auto">
                <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">
                  标注列表（{anno.annotations.length}）
                </div>
                <AnnotationPanel
                  muralId={id!}
                  annotations={anno.annotations}
                  loading={anno.loading}
                  selectedId={anno.selected}
                  onSelect={anno.setSelected}
                  onUpdate={(aid, data) => anno.editAnnotation(aid, data)}
                  onDelete={anno.removeAnnotation}
                />
              </div>
              {/* 病害属性选择弹窗 */}
              <DamageTypeModal
                open={!!pendingCoords}
                onConfirm={(damageType, severity, description) => {
                  if (pendingCoords) {
                    anno.addAnnotation(pendingCoords, damageType, severity, description);
                    setPendingCoords(null);
                  }
                }}
                onCancel={() => setPendingCoords(null)}
              />
            </div>
          ) : (
            <Empty description="请先上传壁画图像" />
          ),
        },
        {
          key: 'history',
          label: <span><HistoryOutlined className="mr-1" />修改历史</span>,
          children: history.length ? (
            <Timeline
              items={history.map((h) => ({
                children: (
                  <div className="text-sm">
                    <span className="font-medium">修改字段：{h.field}</span>
                    <div className="text-text-secondary mt-1">
                      {h.oldValue && <span className="line-through mr-2">{h.oldValue}</span>}
                      {h.newValue && <span className="text-primary">{h.newValue}</span>}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {new Date(h.changedAt).toLocaleString('zh-CN')} · {h.changedBy}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无修改记录" />
          ),
        },
      ]} />

      {/* 编辑弹窗 */}
      <MuralFormModal
        open={editOpen}
        mural={mural}
        onClose={() => setEditOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
