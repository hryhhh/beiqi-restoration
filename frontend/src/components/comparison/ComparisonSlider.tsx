import { useState, useRef, useCallback } from 'react';

interface Props {
  beforeSrc: string;
  afterSrc: string;
}

/** 滑块叠加对比组件 */
export default function ComparisonSlider({ beforeSrc, afterSrc }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !dragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-col-resize"
      style={{ aspectRatio: '16/9' }}
      onMouseDown={() => { dragging.current = true; }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={() => { dragging.current = true; }}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={() => { dragging.current = false; }}
    >
      {/* 修复后（底层） */}
      <img src={afterSrc} alt="修复后" className="absolute inset-0 w-full h-full object-cover" />
      {/* 修复前（裁剪层） */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={beforeSrc} alt="修复前" className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current?.clientWidth }} />
      </div>
      {/* 滑块线 */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-xs font-bold text-gray-500">
          ⇔
        </div>
      </div>
      {/* 标签 */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">修复前</div>
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">修复后</div>
    </div>
  );
}
