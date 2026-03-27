import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import * as api from '@/api/annotation';
import type { DamageAnnotation, AnnotationCoordinates, DamageType } from '@/types';
import type { ImageType } from '@/types';

/** 绘制模式 */
export type DrawMode = 'polygon' | 'rect' | 'path' | null;

export function useAnnotation(muralId: string) {
  const [annotations, setAnnotations] = useState<DamageAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState<ImageType>('visible');
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  /** 加载标注列表 */
  const fetchAnnotations = useCallback(async (layer?: ImageType) => {
    setLoading(true);
    try {
      const data = await api.getAnnotations(muralId, layer || activeLayer);
      setAnnotations(data || []);
    } catch {
      message.error('加载标注失败');
    } finally {
      setLoading(false);
    }
  }, [muralId, activeLayer]);

  /** 切换图层 */
  const switchLayer = useCallback((layer: ImageType) => {
    setActiveLayer(layer);
    setSelected(null);
    fetchAnnotations(layer);
  }, [fetchAnnotations]);

  /** 创建标注 */
  const addAnnotation = useCallback(async (
    coordinates: AnnotationCoordinates,
    damageType: DamageType,
    severity: number,
    description?: string,
  ) => {
    try {
      await api.createAnnotation(muralId, {
        damageType, severity, imageLayer: activeLayer, coordinates, description,
      });
      message.success('标注已创建');
      await fetchAnnotations();
      setDrawMode(null);
    } catch {
      message.error('创建标注失败');
    }
  }, [muralId, activeLayer, fetchAnnotations]);

  /** 更新标注 */
  const editAnnotation = useCallback(async (
    id: string,
    data: { damageType?: DamageType; severity?: number; coordinates?: AnnotationCoordinates },
  ) => {
    try {
      await api.updateAnnotation(muralId, id, data);
      message.success('标注已更新');
      await fetchAnnotations();
    } catch {
      message.error('更新标注失败');
    }
  }, [muralId, fetchAnnotations]);

  /** 删除标注 */
  const removeAnnotation = useCallback(async (id: string) => {
    try {
      await api.deleteAnnotation(muralId, id);
      message.success('标注已删除');
      if (selectedRef.current === id) setSelected(null);
      await fetchAnnotations();
    } catch {
      message.error('删除标注失败');
    }
  }, [muralId, fetchAnnotations]);

  return {
    annotations, loading, activeLayer, drawMode, selected,
    setDrawMode, setSelected, switchLayer,
    fetchAnnotations, addAnnotation, editAnnotation, removeAnnotation,
  };
}
