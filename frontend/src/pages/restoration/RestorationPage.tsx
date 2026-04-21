import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  App,
  Button,
  Card,
  Collapse,
  Empty,
  Radio,
  Select,
  Slider,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { getAnnotations } from '@/api/annotation';
import { getMurals, uploadMuralImage } from '@/api/mural';
import { generateRestoration } from '@/api/restoration';
import RestorationSelectionCanvas from '@/components/restoration/RestorationSelectionCanvas';
import ComparisonView from '@/components/comparison/ComparisonView';
import { DAMAGE_TYPE_MAP, MURAL_STATUS_MAP } from '@/constants';
import {
  buildSaveFileName,
  createInitialRestorationParameters,
  getStartDisabledReason,
  resetSessionForMuralChange,
  selectRestorationResult,
} from '@/pages/restoration/restorationState';
import type {
  AnnotationCoordinates,
  DamageAnnotation,
  MuralRecord,
  RestorationMode,
  RestorationParameters,
  RestorationResult,
} from '@/types';
import { imageUrlToFile } from '@/utils/imageUtils';
import './restoration.css';

const { Title, Paragraph, Text } = Typography;

type ParameterKey = keyof RestorationParameters;

const defaultParameterConfig: Array<{ key: ParameterKey; label: string }> = [
  { key: 'restorationStrength', label: '修复强度' },
  { key: 'cleaningLevel', label: '去污程度' },
  { key: 'colorRecovery', label: '色彩还原' },
  { key: 'detailPreservation', label: '细节保留' },
  { key: 'crackRepairBias', label: '裂隙修补倾向' },
];

const advancedParameterGroups: Array<{
  key: string;
  label: string;
  items: Array<{ key: ParameterKey; label: string }>;
}> = [
  {
    key: 'structure',
    label: '结构修补',
    items: [
      { key: 'structureClosure', label: '裂隙闭合' },
      { key: 'structureFill', label: '缺损填补' },
      { key: 'edgeBlend', label: '边缘融合' },
    ],
  },
  {
    key: 'surface',
    label: '表面清理',
    items: [
      { key: 'stainRemoval', label: '污渍清除' },
      { key: 'moldSuppression', label: '霉斑抑制' },
      { key: 'saltReduction', label: '盐析弱化' },
    ],
  },
  {
    key: 'texture',
    label: '色彩纹理',
    items: [
      { key: 'toneCorrection', label: '综合色偏修正' },
      { key: 'localColorRepair', label: '局部色彩补全' },
      { key: 'textureRebuild', label: '纹理重建强度' },
    ],
  },
];

export default function RestorationPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [selectedMuralId, setSelectedMuralId] = useState('');
  const [mode, setMode] = useState<RestorationMode>('full');
  const [parameters, setParameters] = useState(createInitialRestorationParameters());
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [annotations, setAnnotations] = useState<DamageAnnotation[]>([]);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>([]);
  const [manualSelection, setManualSelection] = useState<AnnotationCoordinates | null>(null);
  const [currentResult, setCurrentResult] = useState<RestorationResult | null>(null);
  const [variants, setVariants] = useState<RestorationResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMurals({ pageSize: 200 })
      .then((response) => setMurals(response.data || []))
      .catch(() => {
        message.error('加载壁画列表失败');
      });
  }, [message]);

  useEffect(() => {
    if (!selectedMuralId) {
      setAnnotations([]);
      return;
    }

    getAnnotations(selectedMuralId, 'visible')
      .then(setAnnotations)
      .catch(() => {
        setAnnotations([]);
      });
  }, [selectedMuralId]);

  useEffect(() => () => {
    if (sourceImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImageUrl);
    }
  }, [sourceImageUrl]);

  const selectedMural = useMemo(
    () => murals.find((item) => item.id === selectedMuralId) || null,
    [murals, selectedMuralId],
  );

  const startDisabledReason = useMemo(() => getStartDisabledReason({
    muralId: selectedMuralId,
    sourceImageUrl,
    mode,
    selectedAnnotationIds,
    manualSelection,
  }), [selectedMuralId, sourceImageUrl, mode, selectedAnnotationIds, manualSelection]);

  const handleMuralChange = (value: string) => {
    if (sourceImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImageUrl);
    }

    const reset = resetSessionForMuralChange({
      sourceImageUrl,
      selectedAnnotationIds,
      manualSelection,
      currentResultId: currentResult?.id || null,
      variantCount: variants.length,
    });

    setSelectedMuralId(value);
    setSourceImageUrl(reset.sourceImageUrl);
    setSelectedAnnotationIds(reset.selectedAnnotationIds);
    setManualSelection(reset.manualSelection);
    setCurrentResult(null);
    setVariants([]);
  };

  const handleSourceUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.warning('请上传图片文件');
      return Upload.LIST_IGNORE;
    }

    if (sourceImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImageUrl);
    }

    setSourceImageUrl(URL.createObjectURL(file));
    setManualSelection(null);
    setCurrentResult(null);
    setVariants([]);
    return false;
  };

  const updateParameter = (key: ParameterKey, value: number | string) => {
    setParameters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const selectedAnnotationOptions = annotations.map((annotation) => ({
    value: annotation.id,
    label: `${DAMAGE_TYPE_MAP[annotation.damageType]?.label || annotation.damageType} · 严重度 ${annotation.severity}`,
  }));

  const selectedAnnotationShapes = useMemo(
    () => annotations
      .filter((item) => selectedAnnotationIds.includes(item.id))
      .map((item) => item.coordinates),
    [annotations, selectedAnnotationIds],
  );

  const handleGenerate = async (variantBase: RestorationResult | null = null) => {
    if (startDisabledReason || !sourceImageUrl || !selectedMuralId) {
      if (startDisabledReason) {
        message.warning(startDisabledReason);
      }
      return;
    }

    setGenerating(true);
    try {
      const result = await generateRestoration({
        muralId: selectedMuralId,
        mode,
        sourceImageUrl,
        parameters,
        annotationShapes: selectedAnnotationShapes,
        annotationIds: selectedAnnotationIds,
        manualSelection,
        variantBase,
      });

      if (variantBase) {
        setVariants((previous) => [...previous, result]);
        setCurrentResult(result);
      } else {
        setCurrentResult(result);
        setVariants([]);
      }
    } catch {
      message.error('修复结果生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentResult || !selectedMuralId) {
      return;
    }

    setSaving(true);
    try {
      const file = await imageUrlToFile(
        currentResult.imageUrl,
        buildSaveFileName(selectedMuralId, new Date()),
      );
      await uploadMuralImage(selectedMuralId, file, 'restored');
      message.success(currentResult.isMock ? '演示结果已保存为修复后图层' : '修复结果已保存为修复后图层');
      navigate(`/murals/${selectedMuralId}`);
    } catch {
      message.error('保存修复结果失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="restoration-page">
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>壁画修复工作台</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          选择壁画、上传待修复原图、调整参数并生成修复结果。当前优先保证完整闭环，真实接口不可用时会降级到演示模式。
        </Paragraph>
      </div>

      {startDisabledReason && (
        <Alert
          type="info"
          showIcon
          message={startDisabledReason}
        />
      )}

      <Card className="restoration-card" title="顶部上下文区">
        <div className="restoration-context">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Select
              showSearch
              placeholder="请选择目标壁画"
              value={selectedMuralId || undefined}
              options={murals.map((mural) => ({
                value: mural.id,
                label: `${mural.name}（${mural.site}）`,
              }))}
              onChange={handleMuralChange}
              filterOption={(input, option) =>
                (option?.label as string | undefined)?.toLowerCase().includes(input.toLowerCase()) ?? false
              }
            />
            <Radio.Group
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '整图修复', value: 'full' },
                { label: '局部精修', value: 'partial' },
              ]}
            />
          </Space>

          {selectedMural ? (
            <div className="restoration-summary">
              <div className="restoration-summary-item">
                <div className="restoration-summary-label">壁画名称</div>
                <div className="restoration-summary-value">{selectedMural.name}</div>
              </div>
              <div className="restoration-summary-item">
                <div className="restoration-summary-label">所属朝代</div>
                <div className="restoration-summary-value">{selectedMural.era}</div>
              </div>
              <div className="restoration-summary-item">
                <div className="restoration-summary-label">出土地 / 地点</div>
                <div className="restoration-summary-value">{selectedMural.site}</div>
              </div>
              <div className="restoration-summary-item">
                <div className="restoration-summary-label">当前状态</div>
                <div className="restoration-summary-value">{MURAL_STATUS_MAP[selectedMural.status]}</div>
              </div>
            </div>
          ) : (
            <Empty description="请选择要进入修复工作台的壁画" />
          )}
        </div>
      </Card>

      <Card className="restoration-card" title="参数区">
        <div className="restoration-params-grid">
          {defaultParameterConfig.map((item) => (
            <div key={item.key} className="restoration-slider-row">
              <div className="restoration-slider-label">
                <span>{item.label}</span>
                <Text type="secondary">{parameters[item.key]}</Text>
              </div>
              <Slider
                value={parameters[item.key] as number}
                onChange={(value) => updateParameter(item.key, value)}
              />
            </div>
          ))}
        </div>

        <Collapse
          ghost
          items={advancedParameterGroups.map((group) => ({
            key: group.key,
            label: group.label,
            children: (
              <div className="restoration-params-grid">
                {group.items.map((item) => (
                  <div key={item.key} className="restoration-slider-row">
                    <div className="restoration-slider-label">
                      <span>{item.label}</span>
                      <Text type="secondary">{parameters[item.key]}</Text>
                    </div>
                    <Slider
                      value={parameters[item.key] as number}
                      onChange={(value) => updateParameter(item.key, value)}
                    />
                  </div>
                ))}
              </div>
            ),
          }))}
        />

        <div className="restoration-params-grid">
          <div className="restoration-slider-row">
            <div className="restoration-slider-label">
              <span>输出倾向</span>
              <Text type="secondary">{parameters.outputPreference === 'fidelity' ? '保真优先' : '清晰优先'}</Text>
            </div>
            <Radio.Group
              value={parameters.outputPreference}
              onChange={(event) => updateParameter('outputPreference', event.target.value)}
              options={[
                { label: '保真优先', value: 'fidelity' },
                { label: '清晰优先', value: 'clarity' },
              ]}
            />
          </div>
          <div className="restoration-slider-row">
            <div className="restoration-slider-label">
              <span>生成随机性</span>
              <Text type="secondary">{parameters.randomness}</Text>
            </div>
            <Slider
              value={parameters.randomness}
              onChange={(value) => updateParameter('randomness', value)}
            />
          </div>
        </div>
      </Card>

      <div className="restoration-grid">
        <Card className="restoration-card" title="原图区">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Upload.Dragger
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleSourceUpload}
              className="restoration-upload"
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽上传待修复原图</p>
              <p className="restoration-upload-hint">支持整图修复和局部精修；切换壁画时会清空当前上传和结果。</p>
            </Upload.Dragger>

            {sourceImageUrl ? (
              <img src={sourceImageUrl} alt="待修复原图" className="restoration-source-preview" />
            ) : (
              <Empty description="上传后会在这里显示修复前图像" />
            )}

            {mode === 'partial' && (
              <div className="restoration-annotation-stack">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="选择已有病害标注（可选）"
                  value={selectedAnnotationIds}
                  options={selectedAnnotationOptions}
                  onChange={setSelectedAnnotationIds}
                  disabled={!selectedMuralId}
                />
                <Text type="secondary">
                  局部精修至少需要一条已有标注或一个手动选区。已有标注来自当前壁画的可见光图层。
                </Text>
                {sourceImageUrl ? (
                  <RestorationSelectionCanvas
                    imageUrl={sourceImageUrl}
                    selection={manualSelection}
                    onSelectionChange={setManualSelection}
                  />
                ) : (
                  <Empty description="先上传原图后再绘制手动选区" />
                )}
              </div>
            )}
          </Space>
        </Card>

        <Card
          className="restoration-card"
          title="结果区"
          extra={currentResult
            ? <Tag color={currentResult.isMock ? 'gold' : 'green'}>{currentResult.isMock ? '演示模式' : '真实生成'}</Tag>
            : null}
        >
          {currentResult ? (
            <>
              <ComparisonView beforeSrc={sourceImageUrl} afterSrc={currentResult.imageUrl} />
              <div className="restoration-variant-strip">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={variant.id === currentResult.id ? 'restoration-variant restoration-variant--active' : 'restoration-variant'}
                    onClick={() => setCurrentResult(selectRestorationResult(currentResult, variants, variant.id))}
                  >
                    <img src={variant.imageUrl} alt={`变体 ${variant.id}`} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Empty description="开始修复后将在这里显示主结果与变体" />
          )}
        </Card>
      </div>

      <div className="restoration-actions">
        <Button
          type="primary"
          disabled={!!startDisabledReason}
          loading={generating}
          onClick={() => void handleGenerate()}
        >
          开始修复
        </Button>
        <Button
          disabled={!currentResult || generating}
          onClick={() => void handleGenerate(currentResult)}
        >
          再次生成变体
        </Button>
        <Button
          disabled={!currentResult}
          loading={saving}
          onClick={() => void handleSave()}
        >
          确认保存为修复后图像
        </Button>
      </div>
    </div>
  );
}
