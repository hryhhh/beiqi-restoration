import { Button, Tooltip, Segmented } from 'antd';
import {
  GatewayOutlined,
  BorderOutlined,
  StopOutlined,
  ReloadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { DrawMode } from '@/hooks/useAnnotation';
import type { ImageType } from '@/types';
import { IMAGE_TYPE_MAP } from '@/constants';

interface Props {
  drawMode: DrawMode;
  activeLayer: ImageType;
  layers: ImageType[];
  annotationCount: number;
  geometryEditMode: boolean;
  geometryDirty: boolean;
  canEditGeometry: boolean;
  onDrawModeChange: (mode: DrawMode) => void;
  onLayerChange: (layer: ImageType) => void;
  onRefresh: () => void;
  onGeometryEditToggle: () => void;
  onGeometrySave: () => void;
  onGeometryCancel: () => void;
}

/** 标注工具栏：绘制模式切换 + 图层切换 */
export default function AnnotationToolbar({
  drawMode,
  activeLayer,
  layers,
  annotationCount,
  geometryEditMode,
  geometryDirty,
  canEditGeometry,
  onDrawModeChange,
  onLayerChange,
  onRefresh,
  onGeometryEditToggle,
  onGeometrySave,
  onGeometryCancel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-b px-4 py-2">
      {/* 绘制工具 */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-sm text-text-secondary mr-2">绘制工具：</span>
        <Tooltip title="多边形（双击或回车完成）">
          <Button
            type={drawMode === 'polygon' ? 'primary' : 'default'}
            icon={<GatewayOutlined />}
            size="small"
            disabled={geometryEditMode}
            onClick={() => onDrawModeChange(drawMode === 'polygon' ? null : 'polygon')}
          />
        </Tooltip>
        <Tooltip title="矩形">
          <Button
            type={drawMode === 'rect' ? 'primary' : 'default'}
            icon={<BorderOutlined />}
            size="small"
            disabled={geometryEditMode}
            onClick={() => onDrawModeChange(drawMode === 'rect' ? null : 'rect')}
          />
        </Tooltip>
        {drawMode && (
          <Tooltip title="取消绘制">
            <Button
              danger
              icon={<StopOutlined />}
              size="small"
              onClick={() => onDrawModeChange(null)}
            />
          </Tooltip>
        )}
        {drawMode === 'polygon' && (
          <span className="text-xs text-text-secondary ml-2">点击添加顶点，双击完成</span>
        )}
        {drawMode === 'rect' && (
          <span className="text-xs text-text-secondary ml-2">拖拽绘制矩形</span>
        )}
        {!drawMode && geometryEditMode && (
          <span className="text-xs text-text-secondary ml-2">拖动白色控制点调整轮廓，保存后写回标注坐标</span>
        )}
        {!drawMode && !geometryEditMode && (
          <span className="text-xs text-text-secondary ml-2">滚轮缩放，拖拽平移，点击区域可选中标注</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary">当前图层 {annotationCount} 条标注</span>
        {geometryEditMode ? (
          <>
            <Tooltip title="保存几何调整">
              <Button
                size="small"
                type="primary"
                icon={<SaveOutlined />}
                disabled={!geometryDirty}
                onClick={onGeometrySave}
              >
                保存轮廓
              </Button>
            </Tooltip>
            <Tooltip title="取消几何调整">
              <Button size="small" icon={<CloseOutlined />} onClick={onGeometryCancel}>
                取消
              </Button>
            </Tooltip>
          </>
        ) : (
          <Tooltip title={canEditGeometry ? '对当前选中标注进行几何调整' : '请先选中一条标注'}>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={!canEditGeometry || !!drawMode}
              onClick={onGeometryEditToggle}
            >
              几何编辑
            </Button>
          </Tooltip>
        )}
        <Tooltip title="刷新当前图层标注">
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
        </Tooltip>
        {layers.length > 1 && (
          <Segmented
            size="small"
            value={activeLayer}
            options={layers.map((l) => ({ value: l, label: IMAGE_TYPE_MAP[l] }))}
            onChange={(v) => onLayerChange(v as ImageType)}
          />
        )}
      </div>
    </div>
  );
}
