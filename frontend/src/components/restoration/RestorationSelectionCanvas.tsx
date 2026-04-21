import { useMemo, useState } from 'react';
import AnnotationCanvas from '@/components/annotation/AnnotationCanvas';
import AnnotationToolbar from '@/components/annotation/AnnotationToolbar';
import type { DrawMode } from '@/hooks/useAnnotation';
import type { AnnotationCoordinates } from '@/types';

interface Props {
  imageUrl: string;
  selection: AnnotationCoordinates | null;
  onSelectionChange: (selection: AnnotationCoordinates | null) => void;
}

export default function RestorationSelectionCanvas({
  imageUrl,
  selection,
  onSelectionChange,
}: Props) {
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const emptyAnnotations = useMemo(() => [], []);

  return (
    <div className="restoration-selection">
      <AnnotationToolbar
        drawMode={drawMode}
        activeLayer="visible"
        layers={['visible']}
        annotationCount={selection ? 1 : 0}
        geometryEditMode={false}
        geometryDirty={false}
        canEditGeometry={false}
        onDrawModeChange={setDrawMode}
        onLayerChange={() => undefined}
        onRefresh={() => undefined}
        onGeometryEditToggle={() => undefined}
        onGeometrySave={() => undefined}
        onGeometryCancel={() => undefined}
      />
      <AnnotationCanvas
        imageUrl={imageUrl}
        annotations={emptyAnnotations}
        drawMode={drawMode}
        pendingCoords={selection}
        selectedId={null}
        geometryEditMode={false}
        editingAnnotationId={null}
        geometryDraft={null}
        onGeometryDraftChange={() => undefined}
        onSelect={() => undefined}
        onDrawComplete={(coords) => {
          onSelectionChange(coords);
          setDrawMode(null);
        }}
      />
    </div>
  );
}
