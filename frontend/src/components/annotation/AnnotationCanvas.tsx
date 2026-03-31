import { useEffect, useRef, useCallback } from 'react';
import OpenSeadragon from 'openseadragon';
import * as fabric from 'fabric';
import type { DamageAnnotation, AnnotationCoordinates } from '@/types';
import type { DrawMode } from '@/hooks/useAnnotation';

/** 病害类型对应的标注颜色 */
const DAMAGE_COLORS: Record<string, string> = {
  detachment: '#e74c3c', flaking: '#e67e22', salt_efflorescence: '#f1c40f',
  cracking: '#9b59b6', pigment_loss: '#3498db', fading: '#1abc9c',
  soiling: '#95a5a6', mold: '#27ae60', insect_damage: '#d35400', root_damage: '#2c3e50',
};

const ANNOTATION_ID_KEY = 'annotationId';
const TEMP_MARK_KEY = 'tempMark';

function setAnnotationId(obj: fabric.Object, annotationId: string) {
  obj.set(ANNOTATION_ID_KEY, annotationId);
}

function getAnnotationId(obj: fabric.Object): string | undefined {
  const value = obj.get(ANNOTATION_ID_KEY);
  return typeof value === 'string' ? value : undefined;
}

function markTemporary(obj: fabric.Object) {
  obj.set(TEMP_MARK_KEY, true);
}

function isTemporary(obj: fabric.Object): boolean {
  return obj.get(TEMP_MARK_KEY) === true;
}

interface Props {
  /** 壁画图像 URL */
  imageUrl: string;
  /** 标注列表 */
  annotations: DamageAnnotation[];
  /** 当前绘制模式 */
  drawMode: DrawMode;
  /** 当前选中的标注 ID */
  selectedId: string | null;
  /** 选中标注回调 */
  onSelect: (id: string | null) => void;
  /** 绘制完成回调，返回坐标 */
  onDrawComplete: (coords: AnnotationCoordinates) => void;
}

/**
 * 标注画布组件
 * OpenSeadragon 底层瓦片渲染 + Fabric.js 叠加层标注绘制
 */
export default function AnnotationCanvas({
  imageUrl, annotations, drawMode, selectedId, onSelect, onDrawComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const drawPointsRef = useRef<number[][]>([]);

  /** 将图像相对坐标 [0,1] 转换为画布像素坐标 */
  const imageToCanvas = useCallback((x: number, y: number): { x: number; y: number } => {
    const viewer = viewerRef.current;
    if (!viewer) return { x: 0, y: 0 };
    const viewportPoint = viewer.viewport.imageToViewportCoordinates(x, y);
    const webPoint = viewer.viewport.viewportToViewerElementCoordinates(viewportPoint);
    return { x: webPoint.x, y: webPoint.y };
  }, []);

  /** 将画布像素坐标转换为图像相对坐标 [0,1] */
  const canvasToImage = useCallback((px: number, py: number): { x: number; y: number } => {
    const viewer = viewerRef.current;
    if (!viewer) return { x: 0, y: 0 };
    const webPoint = new OpenSeadragon.Point(px, py);
    const viewportPoint = viewer.viewport.viewerElementToViewportCoordinates(webPoint);
    const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
    return { x: imagePoint.x, y: imagePoint.y };
  }, []);

  /** 在 Fabric 画布上渲染所有标注 */
  const renderAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.clear();

    for (const anno of annotations) {
      let coords: AnnotationCoordinates;
      try {
        coords = typeof anno.coordinates === 'string'
          ? JSON.parse(anno.coordinates as unknown as string)
          : anno.coordinates;
      } catch { continue; }

      const color = DAMAGE_COLORS[anno.damageType] || '#e74c3c';
      const isSelected = anno.id === selectedId;
      const points = coords.points.map((p) => imageToCanvas(p[0], p[1]));

      if (coords.type === 'rect' && points.length >= 2) {
        const [tl, br] = [points[0], points[1]];
        const rect = new fabric.Rect({
          left: Math.min(tl.x, br.x),
          top: Math.min(tl.y, br.y),
          width: Math.abs(br.x - tl.x),
          height: Math.abs(br.y - tl.y),
          fill: color + '30',
          stroke: isSelected ? '#fff' : color,
          strokeWidth: isSelected ? 3 : 2,
          selectable: false,
        });
        setAnnotationId(rect, anno.id);
        canvas.add(rect);
      } else {
        // polygon 或 path
        const poly = new fabric.Polygon(points, {
          fill: color + '30',
          stroke: isSelected ? '#fff' : color,
          strokeWidth: isSelected ? 3 : 2,
          selectable: false,
        });
        setAnnotationId(poly, anno.id);
        canvas.add(poly);
      }
    }

    canvas.renderAll();
  }, [annotations, selectedId, imageToCanvas]);

  const renderAnnotationsRef = useRef(renderAnnotations);
  useEffect(() => {
    renderAnnotationsRef.current = renderAnnotations;
  }, [renderAnnotations]);

  /** 初始化 OpenSeadragon + Fabric.js 叠加层 */
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@5.0/build/openseadragon/images/',
      tileSources: { type: 'image', url: imageUrl },
      showNavigationControl: true,
      gestureSettingsMouse: { clickToZoom: false },
      animationTime: 0.3,
    });
    viewerRef.current = viewer;

    // 创建 Fabric.js 叠加层
    viewer.addHandler('open', () => {
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'absolute inset-0 pointer-events-none';
      overlayRef.current = overlayCanvas;
      containerRef.current!.querySelector('.openseadragon-canvas')?.appendChild(overlayCanvas);

      const resize = () => {
        const container = containerRef.current;
        if (!container) return;
        overlayCanvas.width = container.clientWidth;
        overlayCanvas.height = container.clientHeight;
        overlayCanvas.style.width = container.clientWidth + 'px';
        overlayCanvas.style.height = container.clientHeight + 'px';
      };
      resize();

      const fCanvas = new fabric.Canvas(overlayCanvas, {
        selection: false,
        renderOnAddRemove: false,
      });
      canvasRef.current = fCanvas;

      // 视口变化时重新渲染标注
      const onViewerAnimation = () => renderAnnotationsRef.current();
      const onViewerResize = () => { resize(); renderAnnotationsRef.current(); };
      viewer.addHandler('animation', onViewerAnimation);
      viewer.addHandler('resize', onViewerResize);

      renderAnnotationsRef.current();
    });

    return () => {
      canvasRef.current?.dispose();
      canvasRef.current = null;
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [imageUrl]);

  /** 标注数据或选中状态变化时重新渲染 */
  useEffect(() => {
    renderAnnotations();
  }, [renderAnnotations]);

  /** 处理绘制模式下的交互 */
  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas) return;

    if (!drawMode) {
      // 非绘制模式：启用 OSD 拖拽，Fabric 不拦截事件
      viewer.setMouseNavEnabled(true);
      canvas.wrapperEl.style.pointerEvents = 'none';
      drawPointsRef.current = [];

      // 点击标注选中
      const clickHandler = (e: OpenSeadragon.CanvasClickEvent) => {
        const pos = e.position;
        const targetInfo = canvas.findTarget(
          { clientX: pos.x, clientY: pos.y } as unknown as MouseEvent
        );
        const target = targetInfo.target;
        if (target) {
          const annotationId = getAnnotationId(target);
          if (annotationId) {
            onSelect(annotationId);
            return;
          }
        }
        onSelect(null);
      };
      viewer.addHandler('canvas-click', clickHandler);
      return () => { viewer.removeHandler('canvas-click', clickHandler); };
    }

    // 绘制模式：禁用 OSD 拖拽，Fabric 拦截事件
    viewer.setMouseNavEnabled(false);
    canvas.wrapperEl.style.pointerEvents = 'auto';
    drawPointsRef.current = [];

    let tempShape: fabric.Object | null = null;
    let startPoint: { x: number; y: number } | null = null;

    const handleMouseDown = (opt: fabric.CanvasEvents['mouse:down']) => {
      const pointer = canvas.getViewportPoint(opt.e);
      const imgPt = canvasToImage(pointer.x, pointer.y);

      if (drawMode === 'rect') {
        startPoint = pointer;
        drawPointsRef.current = [[imgPt.x, imgPt.y]];
        tempShape = new fabric.Rect({
          left: pointer.x, top: pointer.y, width: 0, height: 0,
          fill: 'rgba(231,76,60,0.2)', stroke: '#e74c3c', strokeWidth: 2,
          selectable: false,
        });
        canvas.add(tempShape);
      } else if (drawMode === 'polygon') {
        drawPointsRef.current.push([imgPt.x, imgPt.y]);
        // 绘制临时点
        const dot = new fabric.Circle({
          left: pointer.x - 4, top: pointer.y - 4, radius: 4,
          fill: '#e74c3c', selectable: false,
        });
        markTemporary(dot);
        canvas.add(dot);
        canvas.renderAll();
      }
    };

    const handleMouseMove = (opt: fabric.CanvasEvents['mouse:move']) => {
      if (drawMode === 'rect' && tempShape && startPoint) {
        const pointer = canvas.getViewportPoint(opt.e);
        const rect = tempShape as fabric.Rect;
        rect.set({
          left: Math.min(startPoint.x, pointer.x),
          top: Math.min(startPoint.y, pointer.y),
          width: Math.abs(pointer.x - startPoint.x),
          height: Math.abs(pointer.y - startPoint.y),
        });
        canvas.renderAll();
      }
    };

    const handleMouseUp = (opt: fabric.CanvasEvents['mouse:up']) => {
      if (drawMode === 'rect' && startPoint) {
        const pointer = canvas.getViewportPoint(opt.e);
        const endPt = canvasToImage(pointer.x, pointer.y);
        drawPointsRef.current.push([endPt.x, endPt.y]);
        onDrawComplete({ type: 'rect', points: drawPointsRef.current });
        // 清理临时图形
        if (tempShape) canvas.remove(tempShape);
        tempShape = null;
        startPoint = null;
        drawPointsRef.current = [];
      }
    };

    const handleDblClick = () => {
      if (drawMode === 'polygon' && drawPointsRef.current.length >= 3) {
        onDrawComplete({ type: 'polygon', points: drawPointsRef.current });
        // 清理临时点
        const tempObjects = canvas.getObjects().filter(
          (o) => isTemporary(o)
        );
        tempObjects.forEach((o) => canvas.remove(o));
        drawPointsRef.current = [];
        canvas.renderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDblClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDblClick);
      // 清理临时图形
      const tempObjects = canvas.getObjects().filter(
        (o) => isTemporary(o)
      );
      tempObjects.forEach((o) => canvas.remove(o));
      if (tempShape) canvas.remove(tempShape);
      canvas.renderAll();
    };
  }, [drawMode, canvasToImage, onSelect, onDrawComplete]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: 500 }} />
  );
}
