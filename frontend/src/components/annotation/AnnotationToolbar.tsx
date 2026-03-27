import { Button, Tooltip, Segmented } from 'antd';
import {
  GatewayOutlined, BorderOutlined, StopOutlined,
} from '@ant-design/icons';
import type { DrawMode } from '@/hooks/useAnnotation';
import type { ImageType } from '@/types';
import { IMAGE_TYPE_MAP } from '@/constants';

interface Props {
  drawMode: DrawMode;
  activeLayer: ImageType;
  layers: ImageType[];
  onDrawModeChange: (mode: DrawMode) => void;
  onLayerChange: (layer: ImageType) => void;
}

/** 标注工具栏：绘制模式切换 + 图层切换 */
export default function AnnotationToolbar({
  drawMode, activeLayer, layers, onDrawModeChange, onLayerChange,
}: Props) {
  return (
    <div className="flex items-center justify-between bg-white border-b px-4 py-2">
      {/* 绘制工具 */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-text-secondary mr-2">绘制工具：</span>
        <Tooltip title="多边形（双击完成）">
          <Button
            type={drawMode === 'polygon' ? 'primary' : 'default'}
            icon={<GatewayOutlined />}
            size="small"
            onClick={() => onDrawModeChange(drawMode === 'polygon' ? null : 'polygon')}
          />
        </Tooltip>
        <Tooltip title="矩形">
          <Button
            type={drawMode === 'rect' ? 'primary' : 'default'}
            icon={<BorderOutlined />}
            size="small"
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
      </div>

      {/* 图层切换 */}
      {layers.length > 1 && (
        <Segmented
          size="small"
          value={activeLayer}
          options={layers.map((l) => ({ value: l, label: IMAGE_TYPE_MAP[l] }))}
          onChange={(v) => onLayerChange(v as ImageType)}
        />
      )}
    </div>
  );
}
