import { useState, useRef, useCallback } from 'react';

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
  const sourceKey = `${beforeSrc ?? ''}::${afterSrc ?? ''}`;
  const [mode, setMode] = useState<'side' | 'slider'>('slider');
  const [viewState, setViewState] = useState<{
    sourceKey: string;
    zoom: number;
    offset: { x: number; y: number };
  }>({
    sourceKey,
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const normalizedState = viewState.sourceKey === sourceKey
    ? viewState
    : {
        sourceKey,
        zoom: 1,
        offset: { x: 0, y: 0 },
      };

  const missingBefore = !beforeSrc;
  const missingAfter = !afterSrc;

  const handleZoom = useCallback((delta: number) => {
    setViewState((prev) => {
      const base = prev.sourceKey === sourceKey
        ? prev
        : { sourceKey, zoom: 1, offset: { x: 0, y: 0 } };
      return {
        ...base,
        zoom: Math.max(0.5, Math.min(5, base.zoom + delta)),
      };
    });
  }, [sourceKey]);

  const handlePan = useCallback((dx: number, dy: number) => {
    setViewState((prev) => {
      const base = prev.sourceKey === sourceKey
        ? prev
        : { sourceKey, zoom: 1, offset: { x: 0, y: 0 } };
      return {
        ...base,
        offset: { x: base.offset.x + dx, y: base.offset.y + dy },
      };
    });
  }, [sourceKey]);

  const reset = useCallback(() => {
    setViewState({
      sourceKey,
      zoom: 1,
      offset: { x: 0, y: 0 },
    });
  }, [sourceKey]);

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

  return {
    beforeSrc, afterSrc, missingBefore, missingAfter,
    mode, setMode, zoom: normalizedState.zoom, offset: normalizedState.offset,
    handleZoom, handlePan, reset,
    onWheel, onMouseDown, onMouseMove, onMouseUp,
  };
}
