import { Segmented, Button } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import ComparisonSlider from './ComparisonSlider';
import { useImageCompare } from '@/hooks/useImageCompare';

interface Props {
  beforeSrc?: string;
  afterSrc?: string;
}

/** 图像占位组件 */
function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 border border-dashed rounded text-text-secondary"
      style={{ minHeight: 300 }}>
      <div className="text-center">
        <div className="text-4xl mb-2">🖼️</div>
        <div>{label}</div>
      </div>
    </div>
  );
}

/** 修复前后对比视图：并排（同步缩放平移） / 滑块叠加，支持缺失图像占位 */
export default function ComparisonView({ beforeSrc, afterSrc }: Props) {
  const compare = useImageCompare({ beforeSrc, afterSrc });

  // 两张图都缺失
  if (compare.missingBefore && compare.missingAfter) {
    return <ImagePlaceholder label="暂无修复前后图像，请先上传壁画图像" />;
  }

  const imgStyle: React.CSSProperties = {
    transform: `scale(${compare.zoom}) translate(${compare.offset.x / compare.zoom}px, ${compare.offset.y / compare.zoom}px)`,
    transformOrigin: 'center',
    transition: 'transform 0.1s ease-out',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => compare.handleZoom(-0.2)} />
          <span className="text-xs text-text-secondary">{Math.round(compare.zoom * 100)}%</span>
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => compare.handleZoom(0.2)} />
          <Button size="small" icon={<ReloadOutlined />} onClick={compare.reset} />
        </div>
        <Segmented
          size="small"
          value={compare.mode}
          options={[
            { value: 'slider', label: '滑块对比' },
            { value: 'side', label: '并排对比' },
          ]}
          onChange={(v) => compare.setMode(v as 'side' | 'slider')}
        />
      </div>

      {compare.mode === 'slider' ? (
        compare.missingBefore || compare.missingAfter ? (
          <div className="grid grid-cols-2 gap-4">
            {compare.missingBefore
              ? <ImagePlaceholder label="缺少修复前图像" />
              : <img src={compare.beforeSrc} alt="修复前" className="w-full rounded border" />}
            {compare.missingAfter
              ? <ImagePlaceholder label="缺少修复后图像" />
              : <img src={compare.afterSrc} alt="修复后" className="w-full rounded border" />}
          </div>
        ) : (
          <ComparisonSlider beforeSrc={compare.beforeSrc!} afterSrc={compare.afterSrc!} />
        )
      ) : (
        /* 并排对比：同步缩放和平移 */
        <div
          className="grid grid-cols-2 gap-4 select-none cursor-grab active:cursor-grabbing"
          onWheel={compare.onWheel}
          onMouseDown={compare.onMouseDown}
          onMouseMove={compare.onMouseMove}
          onMouseUp={compare.onMouseUp}
          onMouseLeave={compare.onMouseUp}
        >
          <div className="overflow-hidden rounded border">
            <div className="text-sm text-text-secondary mb-1 px-1">修复前</div>
            {compare.missingBefore
              ? <ImagePlaceholder label="缺少修复前图像" />
              : <img src={compare.beforeSrc} alt="修复前" className="w-full" style={imgStyle} />}
          </div>
          <div className="overflow-hidden rounded border">
            <div className="text-sm text-text-secondary mb-1 px-1">修复后</div>
            {compare.missingAfter
              ? <ImagePlaceholder label="缺少修复后图像" />
              : <img src={compare.afterSrc} alt="修复后" className="w-full" style={imgStyle} />}
          </div>
        </div>
      )}
    </div>
  );
}
