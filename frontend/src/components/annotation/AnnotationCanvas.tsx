import { useEffect, useRef, useCallback, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import * as fabric from 'fabric';
import type { DamageAnnotation, AnnotationCoordinates } from '@/types';
import type { DrawMode } from '@/hooks/useAnnotation';

const DAMAGE_COLORS: Record<string, string> = {
  detachment: '#e74c3c',
  flaking: '#e67e22',
  salt_efflorescence: '#f1c40f',
  cracking: '#9b59b6',
  pigment_loss: '#3498db',
  fading: '#1abc9c',
  soiling: '#95a5a6',
  mold: '#27ae60',
  insect_damage: '#d35400',
  root_damage: '#2c3e50',
};

const ANNOTATION_ID_KEY = 'annotationId';
const TEMP_MARK_KEY = 'tempMark';
const TEMP_PREVIEW_KEY = 'tempPreview';
const EDIT_HANDLE_KIND_KEY = 'editHandleKind';
const EDIT_HANDLE_INDEX_KEY = 'editHandleIndex';
const EDIT_HANDLE_CORNER_KEY = 'editHandleCorner';

type RectCorner = 'tl' | 'tr' | 'br' | 'bl';
type EditDragState =
  | { kind: 'polygon'; index: number }
  | { kind: 'rect'; corner: RectCorner };

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clampPoint(point: { x: number; y: number }) {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
  };
}

function cloneCoordinates(coords: AnnotationCoordinates): AnnotationCoordinates {
  return {
    type: coords.type,
    points: coords.points.map((point) => [point[0], point[1]]),
  };
}

function parseCoordinates(raw: AnnotationCoordinates | string): AnnotationCoordinates | null {
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

function normalizePolygonPoints(points: number[][]): number[][] {
  if (points.length < 2) return points;
  const result = [...points];
  const last = result[result.length - 1];
  const prev = result[result.length - 2];
  if (Math.abs(last[0] - prev[0]) < 0.0015 && Math.abs(last[1] - prev[1]) < 0.0015) {
    result.pop();
  }
  return result;
}

function normalizeRectPoints(points: number[][]): [[number, number], [number, number]] {
  const [p1, p2] = points;
  const minX = Math.min(p1[0], p2[0]);
  const minY = Math.min(p1[1], p2[1]);
  const maxX = Math.max(p1[0], p2[0]);
  const maxY = Math.max(p1[1], p2[1]);
  return [[minX, minY], [maxX, maxY]];
}

function setAnnotationId(obj: fabric.Object, annotationId: string) {
  obj.set(ANNOTATION_ID_KEY, annotationId);
}

function getAnnotationId(obj: fabric.Object | undefined): string | undefined {
  if (!obj) return undefined;
  const value = obj.get(ANNOTATION_ID_KEY);
  return typeof value === 'string' ? value : undefined;
}

function markTemporary(obj: fabric.Object) {
  obj.set(TEMP_MARK_KEY, true);
}

function isTemporary(obj: fabric.Object): boolean {
  return obj.get(TEMP_MARK_KEY) === true;
}

function markPreview(obj: fabric.Object) {
  obj.set(TEMP_PREVIEW_KEY, true);
}

function isPreview(obj: fabric.Object): boolean {
  return obj.get(TEMP_PREVIEW_KEY) === true;
}

function setEditHandleMeta(obj: fabric.Object, kind: 'polygon' | 'rect', extra: number | RectCorner) {
  obj.set(EDIT_HANDLE_KIND_KEY, kind);
  if (kind === 'polygon') {
    obj.set(EDIT_HANDLE_INDEX_KEY, extra);
  } else {
    obj.set(EDIT_HANDLE_CORNER_KEY, extra);
  }
}

function getEditHandleKind(obj: fabric.Object | undefined): 'polygon' | 'rect' | null {
  if (!obj) return null;
  const value = obj.get(EDIT_HANDLE_KIND_KEY);
  return value === 'polygon' || value === 'rect' ? value : null;
}

function getEditHandleIndex(obj: fabric.Object | undefined): number | null {
  if (!obj) return null;
  const value = obj.get(EDIT_HANDLE_INDEX_KEY);
  return typeof value === 'number' ? value : null;
}

function getEditHandleCorner(obj: fabric.Object | undefined): RectCorner | null {
  if (!obj) return null;
  const value = obj.get(EDIT_HANDLE_CORNER_KEY);
  return value === 'tl' || value === 'tr' || value === 'br' || value === 'bl' ? value : null;
}

function removeObjectsBy(canvas: fabric.Canvas, predicate: (obj: fabric.Object) => boolean) {
  canvas.getObjects().filter(predicate).forEach((obj) => canvas.remove(obj));
}

function getOutlinePoints(coords: AnnotationCoordinates): number[][] {
  if (coords.type === 'rect' && coords.points.length >= 2) {
    const [tl, br] = normalizeRectPoints(coords.points);
    return [
      [tl[0], tl[1]],
      [br[0], tl[1]],
      [br[0], br[1]],
      [tl[0], br[1]],
    ];
  }
  return coords.points;
}

function getCanvasBounds(points: Array<{ x: number; y: number }>) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function isPointInsidePolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, prev = polygon.length - 1; index < polygon.length; prev = index++) {
    const current = polygon[index];
    const previous = polygon[prev];
    const intersects = ((current.y > point.y) !== (previous.y > point.y))
      && (point.x < ((previous.x - current.x) * (point.y - current.y))
        / ((previous.y - current.y) || Number.EPSILON) + current.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function getNormalizedBounds(coords: AnnotationCoordinates) {
  const points = getOutlinePoints(coords);
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function expandNormalizedBounds(bounds: {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}, padding = 0.04) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const width = Math.max(bounds.maxX - bounds.minX, 0.06);
  const height = Math.max(bounds.maxY - bounds.minY, 0.06);
  const halfWidth = Math.min((width / 2) + padding, 0.5);
  const halfHeight = Math.min((height / 2) + padding, 0.5);

  return {
    minX: clamp01(centerX - halfWidth),
    maxX: clamp01(centerX + halfWidth),
    minY: clamp01(centerY - halfHeight),
    maxY: clamp01(centerY + halfHeight),
  };
}

interface Props {
  imageUrl: string;
  annotations: DamageAnnotation[];
  drawMode: DrawMode;
  pendingCoords: AnnotationCoordinates | null;
  selectedId: string | null;
  geometryEditMode: boolean;
  editingAnnotationId: string | null;
  geometryDraft: AnnotationCoordinates | null;
  onGeometryDraftChange: (coords: AnnotationCoordinates) => void;
  onSelect: (id: string | null) => void;
  onDrawComplete: (coords: AnnotationCoordinates) => void;
}

export default function AnnotationCanvas({
  imageUrl,
  annotations,
  drawMode,
  pendingCoords,
  selectedId,
  geometryEditMode,
  editingAnnotationId,
  geometryDraft,
  onGeometryDraftChange,
  onSelect,
  onDrawComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const drawPointsRef = useRef<number[][]>([]);
  const geometryDraftRef = useRef<AnnotationCoordinates | null>(geometryDraft);
  const editDragRef = useRef<EditDragState | null>(null);
  const focusedSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    geometryDraftRef.current = geometryDraft;
  }, [geometryDraft]);

  const imageToCanvas = useCallback((x: number, y: number): { x: number; y: number } => {
    const viewer = viewerRef.current;
    if (!viewer) return { x: 0, y: 0 };
    const viewportPoint = viewer.viewport.imageToViewportCoordinates(x, y);
    const webPoint = viewer.viewport.viewportToViewerElementCoordinates(viewportPoint);
    return { x: webPoint.x, y: webPoint.y };
  }, []);

  const canvasToImage = useCallback((px: number, py: number): { x: number; y: number } => {
    const viewer = viewerRef.current;
    if (!viewer) return { x: 0, y: 0 };
    const webPoint = new OpenSeadragon.Point(px, py);
    const viewportPoint = viewer.viewport.viewerElementToViewportCoordinates(webPoint);
    const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
    return { x: imagePoint.x, y: imagePoint.y };
  }, []);

  const renderSelectionOverlay = useCallback((
    canvas: fabric.Canvas,
    annotationId: string,
    outlinePoints: Array<{ x: number; y: number }>,
    color: string,
  ) => {
    if (!outlinePoints.length) return;

    const { minX, maxX, minY, maxY } = getCanvasBounds(outlinePoints);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);

    const boundsRect = new fabric.Rect({
      left: minX,
      top: minY,
      width,
      height,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeDashArray: [8, 5],
      selectable: false,
      evented: true,
      hoverCursor: 'pointer',
    });
    setAnnotationId(boundsRect, annotationId);
    canvas.add(boundsRect);

    const columns = Math.max(2, Math.min(6, Math.round(width / 48) + 1));
    const rows = Math.max(2, Math.min(6, Math.round(height / 48) + 1));
    for (let x = 1; x <= columns; x += 1) {
      for (let y = 1; y <= rows; y += 1) {
        const dotPoint = {
          x: minX + (width * x) / (columns + 1),
          y: minY + (height * y) / (rows + 1),
        };
        if (!isPointInsidePolygon(dotPoint, outlinePoints)) continue;

        const dot = new fabric.Circle({
          left: dotPoint.x,
          top: dotPoint.y,
          radius: 2.6,
          fill: `${color}cc`,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: true,
          hoverCursor: 'pointer',
        });
        setAnnotationId(dot, annotationId);
        canvas.add(dot);
      }
    }

    outlinePoints.forEach((point) => {
      const marker = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 5.5,
        fill: '#fffdf8',
        stroke: color,
        strokeWidth: 2.2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hoverCursor: 'pointer',
      });
      setAnnotationId(marker, annotationId);
      canvas.add(marker);
    });
  }, []);

  const renderStaticAnnotation = useCallback((
    canvas: fabric.Canvas,
    annotationId: string,
    coords: AnnotationCoordinates,
    color: string,
    isSelected: boolean,
  ) => {
    const points = coords.points.map((point) => imageToCanvas(point[0], point[1]));
    const outlinePoints = getOutlinePoints(coords).map((point) => imageToCanvas(point[0], point[1]));
    if (coords.type === 'rect' && points.length >= 2) {
      const [tl, br] = [points[0], points[1]];
      const rect = new fabric.Rect({
        left: Math.min(tl.x, br.x),
        top: Math.min(tl.y, br.y),
        width: Math.abs(br.x - tl.x),
        height: Math.abs(br.y - tl.y),
        fill: `${color}30`,
        stroke: isSelected ? '#fff' : color,
        strokeWidth: isSelected ? 3 : 2,
        selectable: false,
        evented: true,
        hoverCursor: 'pointer',
      });
      setAnnotationId(rect, annotationId);
      canvas.add(rect);
      if (isSelected) {
        renderSelectionOverlay(canvas, annotationId, outlinePoints, color);
      }
      return;
    }

    const polygon = new fabric.Polygon(points, {
      fill: `${color}30`,
      stroke: isSelected ? '#fff' : color,
      strokeWidth: isSelected ? 3 : 2,
      selectable: false,
      evented: true,
      hoverCursor: 'pointer',
    });
    setAnnotationId(polygon, annotationId);
    canvas.add(polygon);
    if (isSelected) {
      renderSelectionOverlay(canvas, annotationId, outlinePoints, color);
    }
  }, [imageToCanvas, renderSelectionOverlay]);

  const renderEditableAnnotation = useCallback((
    canvas: fabric.Canvas,
    coords: AnnotationCoordinates,
    color: string,
  ) => {
    if (coords.type === 'rect' && coords.points.length >= 2) {
      const [tlImage, brImage] = normalizeRectPoints(coords.points);
      const tl = imageToCanvas(tlImage[0], tlImage[1]);
      const br = imageToCanvas(brImage[0], brImage[1]);

      const rect = new fabric.Rect({
        left: tl.x,
        top: tl.y,
        width: Math.max(br.x - tl.x, 1),
        height: Math.max(br.y - tl.y, 1),
        fill: `${color}22`,
        stroke: '#fff',
        strokeWidth: 3,
        strokeDashArray: [8, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(rect);

      const corners: Array<{ corner: RectCorner; point: { x: number; y: number } }> = [
        { corner: 'tl', point: tl },
        { corner: 'tr', point: { x: br.x, y: tl.y } },
        { corner: 'br', point: br },
        { corner: 'bl', point: { x: tl.x, y: br.y } },
      ];
      corners.forEach(({ corner, point }) => {
        const handle = new fabric.Circle({
          left: point.x,
          top: point.y,
          radius: 6,
          fill: '#fff',
          stroke: color,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: true,
          hoverCursor: 'pointer',
        });
        setEditHandleMeta(handle, 'rect', corner);
        canvas.add(handle);
      });
      return;
    }

    const points = coords.points.map((point) => imageToCanvas(point[0], point[1]));
    const polygon = new fabric.Polygon(points, {
      fill: `${color}22`,
      stroke: '#fff',
      strokeWidth: 3,
      strokeDashArray: [8, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(polygon);

    points.forEach((point, index) => {
      const handle = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 6,
        fill: '#fff',
        stroke: color,
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hoverCursor: 'pointer',
      });
      setEditHandleMeta(handle, 'polygon', index);
      canvas.add(handle);
    });
  }, [imageToCanvas]);

  const renderPendingAnnotation = useCallback((
    canvas: fabric.Canvas,
    coords: AnnotationCoordinates,
  ) => {
    const previewColor = '#d97706';

    if (coords.type === 'rect' && coords.points.length >= 2) {
      const [tlImage, brImage] = normalizeRectPoints(coords.points);
      const tl = imageToCanvas(tlImage[0], tlImage[1]);
      const br = imageToCanvas(brImage[0], brImage[1]);
      canvas.add(new fabric.Rect({
        left: tl.x,
        top: tl.y,
        width: Math.max(br.x - tl.x, 1),
        height: Math.max(br.y - tl.y, 1),
        fill: `${previewColor}18`,
        stroke: previewColor,
        strokeWidth: 2,
        strokeDashArray: [10, 6],
        selectable: false,
        evented: false,
      }));
      return;
    }

    const points = coords.points.map((point) => imageToCanvas(point[0], point[1]));
    if (!points.length) return;

    canvas.add(new fabric.Polygon(points, {
      fill: `${previewColor}18`,
      stroke: previewColor,
      strokeWidth: 2,
      strokeDashArray: [10, 6],
      selectable: false,
      evented: false,
    }));
  }, [imageToCanvas]);

  const renderAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.clear();

    for (const annotation of annotations) {
      const parsed = parseCoordinates(annotation.coordinates);
      if (!parsed) continue;
      const color = DAMAGE_COLORS[annotation.damageType] || '#e74c3c';
      const isEditing = geometryEditMode
        && editingAnnotationId === annotation.id
        && geometryDraftRef.current;
      if (isEditing && geometryDraftRef.current) {
        renderEditableAnnotation(canvas, geometryDraftRef.current, color);
      } else {
        renderStaticAnnotation(canvas, annotation.id, parsed, color, annotation.id === selectedId);
      }
    }

    if (pendingCoords) {
      renderPendingAnnotation(canvas, pendingCoords);
    }

    canvas.renderAll();
  }, [
    annotations,
    editingAnnotationId,
    geometryEditMode,
    pendingCoords,
    renderEditableAnnotation,
    renderPendingAnnotation,
    renderStaticAnnotation,
    selectedId,
  ]);

  const renderAnnotationsRef = useRef(renderAnnotations);
  useEffect(() => {
    renderAnnotationsRef.current = renderAnnotations;
  }, [renderAnnotations]);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = OpenSeadragon({
      element: containerRef.current,
      tileSources: { type: 'image', url: imageUrl },
      showNavigationControl: false,
      gestureSettingsMouse: { clickToZoom: false },
      animationTime: 0.3,
    });
    viewerRef.current = viewer;

    viewer.addHandler('open', () => {
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'absolute inset-0';
      const overlayHost = containerRef.current?.querySelector('.openseadragon-canvas');
      if (!overlayHost) return;
      overlayHost.appendChild(overlayCanvas);

      const resize = () => {
        const container = containerRef.current;
        if (!container) return;
        overlayCanvas.width = container.clientWidth;
        overlayCanvas.height = container.clientHeight;
        overlayCanvas.style.width = `${container.clientWidth}px`;
        overlayCanvas.style.height = `${container.clientHeight}px`;
      };
      resize();

      const fabricCanvas = new fabric.Canvas(overlayCanvas, {
        selection: false,
        renderOnAddRemove: false,
      });
      canvasRef.current = fabricCanvas;
      fabricCanvas.upperCanvasEl.style.pointerEvents = 'auto';
      fabricCanvas.wrapperEl.style.pointerEvents = 'none';
      setCanvasReady(true);

      const onViewerAnimation = () => renderAnnotationsRef.current();
      const onViewerResize = () => {
        resize();
        renderAnnotationsRef.current();
      };
      viewer.addHandler('animation', onViewerAnimation);
      viewer.addHandler('resize', onViewerResize);

      renderAnnotationsRef.current();
    });

    return () => {
      setCanvasReady(false);
      canvasRef.current?.dispose();
      canvasRef.current = null;
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    renderAnnotations();
  }, [renderAnnotations]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !canvasReady) return;

    if (!selectedId) {
      focusedSelectionRef.current = null;
      return;
    }

    if (drawMode || geometryEditMode) {
      return;
    }

    const focusKey = `${imageUrl}:${selectedId}`;
    if (focusedSelectionRef.current === focusKey) {
      return;
    }

    const annotation = annotations.find((item) => item.id === selectedId);
    const parsed = annotation ? parseCoordinates(annotation.coordinates) : null;
    const tiledImage = viewer.world.getItemAt(0);
    if (!parsed || !tiledImage) return;

    const size = tiledImage.getContentSize();
    const bounds = expandNormalizedBounds(getNormalizedBounds(parsed));
    const imageRect = new OpenSeadragon.Rect(
      bounds.minX * size.x,
      bounds.minY * size.y,
      Math.max((bounds.maxX - bounds.minX) * size.x, 1),
      Math.max((bounds.maxY - bounds.minY) * size.y, 1),
    );
    const viewportRect = viewer.viewport.imageToViewportRectangle(
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
    );

    viewer.viewport.fitBoundsWithConstraints(viewportRect, true);
    focusedSelectionRef.current = focusKey;
  }, [
    annotations,
    canvasReady,
    drawMode,
    geometryEditMode,
    imageUrl,
    selectedId,
  ]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas) return;

    const clearTemporaryObjects = () => {
      removeObjectsBy(canvas, (obj) => isTemporary(obj) || isPreview(obj));
      editDragRef.current = null;
      drawPointsRef.current = [];
      canvas.renderAll();
    };

    if (!drawMode && geometryEditMode && editingAnnotationId && geometryDraftRef.current) {
      viewer.setMouseNavEnabled(false);
      canvas.wrapperEl.style.pointerEvents = 'auto';

      const handleMouseDown = (opt: fabric.CanvasEvents['mouse:down']) => {
        const target = opt.target as fabric.Object | undefined;
        const kind = getEditHandleKind(target);
        if (kind === 'polygon') {
          const index = getEditHandleIndex(target);
          if (index != null) editDragRef.current = { kind: 'polygon', index };
        }
        if (kind === 'rect') {
          const corner = getEditHandleCorner(target);
          if (corner) editDragRef.current = { kind: 'rect', corner };
        }
      };

      const handleMouseMove = (opt: fabric.CanvasEvents['mouse:move']) => {
        const drag = editDragRef.current;
        const current = geometryDraftRef.current;
        if (!drag || !current) return;

        const pointer = canvas.getViewportPoint(opt.e);
        const nextPoint = clampPoint(canvasToImage(pointer.x, pointer.y));
        const next = cloneCoordinates(current);

        if (drag.kind === 'polygon' && next.points[drag.index]) {
          next.points[drag.index] = [nextPoint.x, nextPoint.y];
          onGeometryDraftChange(next);
          return;
        }

        if (drag.kind === 'rect' && next.points.length >= 2) {
          const [tl, br] = normalizeRectPoints(next.points);
          let nextTl = [...tl] as [number, number];
          let nextBr = [...br] as [number, number];

          if (drag.corner === 'tl') {
            nextTl = [nextPoint.x, nextPoint.y];
          } else if (drag.corner === 'tr') {
            nextTl = [tl[0], nextPoint.y];
            nextBr = [nextPoint.x, br[1]];
          } else if (drag.corner === 'br') {
            nextBr = [nextPoint.x, nextPoint.y];
          } else if (drag.corner === 'bl') {
            nextTl = [nextPoint.x, tl[1]];
            nextBr = [br[0], nextPoint.y];
          }

          next.points = normalizeRectPoints([nextTl, nextBr]);
          onGeometryDraftChange(next);
        }
      };

      const handleMouseUp = () => {
        editDragRef.current = null;
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
        editDragRef.current = null;
      };
    }

    if (!drawMode) {
      viewer.setMouseNavEnabled(true);
      canvas.wrapperEl.style.pointerEvents = 'none';
      drawPointsRef.current = [];

      const clickHandler = (e: OpenSeadragon.CanvasClickEvent) => {
        const pos = e.position;
        const viewerBounds = viewer.element.getBoundingClientRect();
        const targetInfo = canvas.findTarget(
          {
            clientX: viewerBounds.left + pos.x,
            clientY: viewerBounds.top + pos.y,
          } as unknown as MouseEvent,
        );
        const target = targetInfo.target;
        const annotationId = getAnnotationId(target);
        onSelect(annotationId || null);
      };

      viewer.addHandler('canvas-click', clickHandler);
      return () => {
        viewer.removeHandler('canvas-click', clickHandler);
      };
    }

    viewer.setMouseNavEnabled(false);
    canvas.wrapperEl.style.pointerEvents = 'auto';
    drawPointsRef.current = [];

    let tempShape: fabric.Object | null = null;
    let startPoint: { x: number; y: number } | null = null;

    const renderPolygonPreview = (cursor?: { x: number; y: number }) => {
      removeObjectsBy(canvas, (obj) => isPreview(obj));
      const points = drawPointsRef.current.map((point) => imageToCanvas(point[0], point[1]));
      if (!points.length) {
        canvas.renderAll();
        return;
      }

      const previewPoints = cursor ? [...points, cursor] : points;
      const preview = new fabric.Polyline(previewPoints, {
        fill: 'rgba(231,76,60,0.10)',
        stroke: '#e74c3c',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      markPreview(preview);
      canvas.add(preview);
      canvas.sendObjectToBack(preview);
      canvas.renderAll();
    };

    const handleMouseDown = (opt: fabric.CanvasEvents['mouse:down']) => {
      const pointer = canvas.getViewportPoint(opt.e);
      const imgPoint = clampPoint(canvasToImage(pointer.x, pointer.y));

      if (drawMode === 'rect') {
        startPoint = pointer;
        drawPointsRef.current = [[imgPoint.x, imgPoint.y]];
        tempShape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(231,76,60,0.2)',
          stroke: '#e74c3c',
          strokeWidth: 2,
          selectable: false,
        });
        canvas.add(tempShape);
        return;
      }

      if (drawMode === 'polygon') {
        drawPointsRef.current.push([imgPoint.x, imgPoint.y]);
        const dot = new fabric.Circle({
          left: pointer.x - 4,
          top: pointer.y - 4,
          radius: 4,
          fill: '#e74c3c',
          selectable: false,
        });
        markTemporary(dot);
        canvas.add(dot);
        renderPolygonPreview();
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
        return;
      }

      if (drawMode === 'polygon' && drawPointsRef.current.length) {
        const pointer = canvas.getViewportPoint(opt.e);
        renderPolygonPreview({ x: pointer.x, y: pointer.y });
      }
    };

    const handleMouseUp = (opt: fabric.CanvasEvents['mouse:up']) => {
      if (drawMode === 'rect' && startPoint) {
        const pointer = canvas.getViewportPoint(opt.e);
        const endPoint = clampPoint(canvasToImage(pointer.x, pointer.y));
        drawPointsRef.current.push([endPoint.x, endPoint.y]);
        onDrawComplete({ type: 'rect', points: drawPointsRef.current });
        if (tempShape) canvas.remove(tempShape);
        tempShape = null;
        startPoint = null;
        drawPointsRef.current = [];
      }
    };

    const handleDblClick = () => {
      if (drawMode === 'polygon' && drawPointsRef.current.length >= 3) {
        onDrawComplete({ type: 'polygon', points: normalizePolygonPoints(drawPointsRef.current) });
        clearTemporaryObjects();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTemporaryObjects();
      }
      if (drawMode === 'polygon' && e.key === 'Enter' && drawPointsRef.current.length >= 3) {
        onDrawComplete({ type: 'polygon', points: normalizePolygonPoints(drawPointsRef.current) });
        clearTemporaryObjects();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDblClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDblClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (tempShape) canvas.remove(tempShape);
      clearTemporaryObjects();
    };
  }, [
    canvasReady,
    canvasToImage,
    drawMode,
    editingAnnotationId,
    geometryEditMode,
    imageToCanvas,
    onDrawComplete,
    onGeometryDraftChange,
    onSelect,
  ]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: 500 }} />
  );
}
