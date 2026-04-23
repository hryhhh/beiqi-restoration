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
import { getMurals } from '@/api/mural';
import {
  commitRestorationResult,
  createRestorationRun,
  createRestorationVariant,
  getRestorationRun,
  listRestorationRuns,
} from '@/api/restoration';
import RestorationSelectionCanvas from '@/components/restoration/RestorationSelectionCanvas';
import ComparisonView from '@/components/comparison/ComparisonView';
import { DAMAGE_TYPE_MAP, MURAL_STATUS_MAP } from '@/constants';
import {
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
  RestorationRun,
  RestorationRunDetail,
  RestorationResult,
} from '@/types';
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

const restorationHistoryLimit = 8;
const restorationSelectedMuralKey = 'restoration:selected-mural-id';
const restorationSelectedRunKey = 'restoration:selected-run-id';

function getModeLabel(mode: RestorationMode) {
  return mode === 'partial' ? '局部精修' : '整图修复';
}

function mergeRunHistory(runs: RestorationRun[], nextRun: RestorationRun) {
  return [nextRun, ...runs.filter((item) => item.id !== nextRun.id)]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, restorationHistoryLimit);
}

export default function RestorationPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [selectedMuralId, setSelectedMuralId] = useState('');
  const [mode, setMode] = useState<RestorationMode>('full');
  const [parameters, setParameters] = useState(createInitialRestorationParameters());
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [annotations, setAnnotations] = useState<DamageAnnotation[]>([]);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>([]);
  const [manualSelection, setManualSelection] = useState<AnnotationCoordinates | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RestorationResult | null>(null);
  const [variants, setVariants] = useState<RestorationResult[]>([]);
  const [runHistory, setRunHistory] = useState<RestorationRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringRunId, setRestoringRunId] = useState<string | null>(null);
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
    if (selectedMuralId || murals.length === 0) {
      return;
    }

    const storedMuralId = localStorage.getItem(restorationSelectedMuralKey);
    if (storedMuralId && murals.some((item) => item.id === storedMuralId)) {
      setSelectedMuralId(storedMuralId);
    }
  }, [murals, selectedMuralId]);

  useEffect(() => {
    if (selectedMuralId) {
      localStorage.setItem(restorationSelectedMuralKey, selectedMuralId);
      return;
    }
    localStorage.removeItem(restorationSelectedMuralKey);
  }, [selectedMuralId]);

  useEffect(() => {
    if (activeRunId) {
      localStorage.setItem(restorationSelectedRunKey, activeRunId);
      return;
    }
    localStorage.removeItem(restorationSelectedRunKey);
  }, [activeRunId]);

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

  useEffect(() => {
    if (!selectedMuralId) {
      setRunHistory([]);
      setRestoringRunId(null);
      return;
    }

    let cancelled = false;
    const storedRunId = localStorage.getItem(restorationSelectedRunKey);

    setHistoryLoading(true);
    listRestorationRuns(selectedMuralId, restorationHistoryLimit)
      .then(async (runs) => {
        if (cancelled) {
          return;
        }

        setRunHistory(runs);
        const preferredRun = runs.find((item) => item.id === storedRunId) || runs[0];
        if (!preferredRun) {
          return;
        }

        setRestoringRunId(preferredRun.id);
        try {
          const detail = await getRestorationRun(preferredRun.id);
          if (cancelled) {
            return;
          }

          setSourceImageFile(null);
          setSourceImageUrl(detail.sourceImageUrl);
          setMode(detail.run.mode);
          setParameters(detail.run.parametersSnapshot);
          setSelectedAnnotationIds(detail.run.annotationIds);
          setManualSelection(detail.run.manualSelection);
          setActiveRunId(detail.run.id);
          setCurrentResult(detail.currentResult);
          setVariants(detail.variants);
        } catch {
          if (!cancelled) {
            message.error('加载历史修复记录失败');
          }
        } finally {
          if (!cancelled) {
            setRestoringRunId(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRunHistory([]);
          message.error('加载修复历史失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [message, selectedMuralId]);

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
    sourceImageUrl: sourceImageFile ? sourceImageUrl : '',
    mode,
    selectedAnnotationIds,
    manualSelection,
  }), [selectedMuralId, sourceImageFile, sourceImageUrl, mode, selectedAnnotationIds, manualSelection]);

  const workspaceHint = useMemo(() => {
    if (!sourceImageFile && currentResult) {
      return '当前工作台已恢复到历史修复记录；如需新建修复任务，请重新上传待修复原图。';
    }
    return startDisabledReason;
  }, [currentResult, sourceImageFile, startDisabledReason]);

  const applyRunDetail = (detail: RestorationRunDetail) => {
    setSourceImageFile(null);
    setSourceImageUrl(detail.sourceImageUrl);
    setMode(detail.run.mode);
    setParameters(detail.run.parametersSnapshot);
    setSelectedAnnotationIds(detail.run.annotationIds);
    setManualSelection(detail.run.manualSelection);
    setActiveRunId(detail.run.id);
    setCurrentResult(detail.currentResult);
    setVariants(detail.variants);
  };

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
    setSourceImageFile(null);
    setSourceImageUrl(reset.sourceImageUrl);
    setSelectedAnnotationIds(reset.selectedAnnotationIds);
    setManualSelection(reset.manualSelection);
    setActiveRunId(null);
    setCurrentResult(null);
    setVariants([]);
    setRunHistory([]);
    setRestoringRunId(null);
  };

  const handleSourceUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.warning('请上传图片文件');
      return Upload.LIST_IGNORE;
    }

    if (sourceImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImageUrl);
    }

    setSourceImageFile(file);
    setSourceImageUrl(URL.createObjectURL(file));
    setManualSelection(null);
    setActiveRunId(null);
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

  const handleGenerate = async (variantBase: RestorationResult | null = null) => {
    if (!variantBase && (startDisabledReason || !selectedMuralId)) {
      if (startDisabledReason) {
        message.warning(startDisabledReason);
      }
      return;
    }
    if (!variantBase && !sourceImageFile) {
      message.warning('请先上传待修复原图');
      return;
    }
    if (variantBase && !activeRunId) {
      message.warning('请先生成主结果');
      return;
    }

    setGenerating(true);
    try {
      if (variantBase && activeRunId) {
        const detail = await createRestorationVariant(activeRunId, variantBase.id);
        applyRunDetail(detail);
        setRunHistory((previous) => mergeRunHistory(previous, detail.run));
        message.success(detail.currentResult?.isMock ? '已生成新的修复变体（服务端 mock）' : '已生成新的修复变体');
      } else {
        const detail = await createRestorationRun({
          muralId: selectedMuralId,
          mode,
          sourceFile: sourceImageFile!,
          parameters,
          annotationIds: selectedAnnotationIds,
          manualSelection,
        });
        applyRunDetail(detail);
        setRunHistory((previous) => mergeRunHistory(previous, detail.run));
        message.success(detail.currentResult?.isMock ? '已生成修复结果（服务端 mock）' : '已生成修复结果');
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
      const committed = await commitRestorationResult(currentResult.id);
      setCurrentResult(committed.result);
      setVariants((previous) => previous.map((item) => (
        item.id === committed.result.id ? committed.result : item
      )));
      setRunHistory((previous) => mergeRunHistory(previous, committed.run));
      message.success(committed.result.isMock ? '服务端 mock 结果已保存为修复后图层' : '修复结果已保存为修复后图层');
      navigate(`/murals/${selectedMuralId}`);
    } catch {
      message.error('保存修复结果失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRun = async (runId: string) => {
    if (restoringRunId || (runId === activeRunId && currentResult)) {
      return;
    }

    setRestoringRunId(runId);
    try {
      const detail = await getRestorationRun(runId);
      applyRunDetail(detail);
      setRunHistory((previous) => mergeRunHistory(previous, detail.run));
      message.success('已恢复该次修复记录');
    } catch {
      message.error('加载修复记录失败');
    } finally {
      setRestoringRunId(null);
    }
  };

  return (
    <div className="restoration-page">
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>壁画修复工作台</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          选择壁画、上传待修复原图、调整参数并生成修复结果。当前流程已接到后端 run / result / commit API，真实 provider 不可用时会由服务端 mock 托底。
        </Paragraph>
      </div>

      {workspaceHint && (
        <Alert
          type="info"
          showIcon
          message={workspaceHint}
        />
      )}

      <Card className="restoration-card" title="顶部上下文区">
        <div className="restoration-context-stack">
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

          {selectedMuralId && (
            <div className="restoration-history-panel">
              <div className="restoration-history-header">
                <div>
                  <Text strong>最近修复记录</Text>
                  <div>
                    <Text type="secondary">
                      按创建时间展示；重新选择壁画或刷新后会优先恢复上次查看的修复记录。
                    </Text>
                  </div>
                </div>
                {historyLoading ? (
                  <Tag color="processing">加载中</Tag>
                ) : (
                  <Text type="secondary">{runHistory.length} 条</Text>
                )}
              </div>

              {historyLoading ? (
                <Text type="secondary">正在加载该壁画的修复记录...</Text>
              ) : runHistory.length > 0 ? (
                <div className="restoration-history-list">
                  {runHistory.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      className={run.id === activeRunId
                        ? 'restoration-history-item restoration-history-item--active'
                        : 'restoration-history-item'}
                      onClick={() => void handleRestoreRun(run.id)}
                      disabled={!!restoringRunId}
                    >
                      <div className="restoration-history-title-row">
                        <Space size={[8, 8]} wrap>
                          {run.id === activeRunId && <Tag color="magenta">当前</Tag>}
                          <Tag color={run.mode === 'partial' ? 'volcano' : 'geekblue'}>
                            {getModeLabel(run.mode)}
                          </Tag>
                          <Tag color={run.status === 'succeeded' ? 'green' : 'red'}>
                            {run.status === 'succeeded' ? '已完成' : '失败'}
                          </Tag>
                          {run.committedResultId && <Tag color="cyan">已保存</Tag>}
                          {restoringRunId === run.id && <Tag color="processing">恢复中</Tag>}
                        </Space>
                        <Text type="secondary">{new Date(run.createdAt).toLocaleString('zh-CN')}</Text>
                      </div>
                      <div className="restoration-history-meta">
                        <span>{run.latestResultId ? `结果 ${run.latestResultId.slice(0, 8)}` : '尚无结果'}</span>
                        <span>{run.annotationIds.length > 0 ? `标注 ${run.annotationIds.length} 条` : '无病害标注'}</span>
                        <span>{run.manualSelection ? '含手动选区' : '无手动选区'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前壁画还没有修复记录"
                />
              )}
            </div>
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
            ? <Tag color={currentResult.committedMuralImageId ? 'cyan' : currentResult.isMock ? 'gold' : 'green'}>
              {currentResult.committedMuralImageId ? '已保存' : currentResult.isMock ? '服务端 Mock' : '真实生成'}
            </Tag>
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
          disabled={!!startDisabledReason || !!restoringRunId}
          loading={generating}
          onClick={() => void handleGenerate()}
        >
          开始修复
        </Button>
        <Button
          disabled={!currentResult || generating || !!restoringRunId}
          onClick={() => void handleGenerate(currentResult)}
        >
          再次生成变体
        </Button>
        <Button
          disabled={!currentResult || !!currentResult.committedMuralImageId || !!restoringRunId}
          loading={saving}
          onClick={() => void handleSave()}
        >
          确认保存为修复后图像
        </Button>
      </div>
    </div>
  );
}
