import { useState, useRef, useCallback, useEffect } from 'react';

interface UseImageCompareOptions {
  /** 修复前图像 URL */
  beforeSrc?: string;
  /** 修复后图像 URL */
  afterSrc?: string;
}

interface UseImageCompareReturn {
  /** 修复前图像 URL */
  beforeSrc?: string;
  /** 修复后图像 URL */
  afterSrc?: string;
  /** 是否缺少修复前图像 */
  missingBefore: boolean;
  /** 是否缺少修复后图像 */
  missingAfter: boolean;
  /** 对比模式 */
  mode: 'side' | 'slider';
  setMode: (m: 'side' | 'slider') => void;
  /** 缩放级别 */
  zoom: number;
  /** 平移偏移 */
  offset: { x: number; y: number };
  /** 同步缩放 */
  handleZoom: (delta: number) => void;
  /** 同步平移 */
  handlePan: (dx: number, dy: number) => void;
  /** 重置视图 */
  reset: () => void;
  /** 绑定到容器的 wheel 事件处理 */
  onWheel: (e: React.WheelEvent) => void;
  /** 拖拽相关 */
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

/** 修复前后对比 hook：管理缩放、平移同步和缺失图像检测 */
export function useImageCompare({ beforeSrc, afterSrc }: UseImageCompareOptions): UseImageCompareReturn {
  const [mode, setMode] = useState<'side' | 'slider'>('slider');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const missingBefore = !beforeSrc;
  const missingAfter = !afterSrc;

  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.5, Math.min(5, z + delta)));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
  }, [handleZoom]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    handlePan(e.clientX - lastPos.current.x, e.clientY - lastPos.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [handlePan]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // 切换图像时重置视图
  useEffect(() => { reset(); }, [beforeSrc, afterSrc, reset]);

  return {
    beforeSrc, afterSrc, missingBefore, missingAfter,
    mode, setMode, zoom, offset,
    handleZoom, handlePan, reset,
    onWheel, onMouseDown, onMouseMove, onMouseUp,
  };
}
