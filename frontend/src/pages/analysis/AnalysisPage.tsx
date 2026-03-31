import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Spin, Select } from 'antd';
import {
  CloudUploadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { detectDamage, confirmDetection, generateReport, type DetectionResult, type AnalysisReport } from '@/api/analysis';
import { getMurals } from '@/api/mural';
import { uploadMuralImage } from '@/api/mural';
import { DAMAGE_TYPE_MAP } from '@/constants';
import type { MuralRecord } from '@/types';
import './analysis.css';

/** 前端展示用的检测框 */
interface DetectionBox {
  label: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

/** mock 检测数据（AI 不可用时兜底） */
const MOCK_DETECTIONS: DetectionBox[] = [
  { label: '裂隙', color: '#E74C3C', x: 12, y: 8, w: 28, h: 22, confidence: 0.92 },
  { label: '龟裂', color: '#F39C12', x: 45, y: 15, w: 20, h: 18, confidence: 0.87 },
  { label: '起翘', color: '#F39C12', x: 30, y: 55, w: 22, h: 16, confidence: 0.81 },
  { label: '霉斑', color: '#F39C12', x: 60, y: 50, w: 18, h: 20, confidence: 0.76 },
  { label: '盐析', color: '#3498DB', x: 70, y: 30, w: 16, h: 14, confidence: 0.73 },
];

/** 病害类型对应颜色 */
const DAMAGE_COLORS: Record<string, string> = {
  cracking: '#E74C3C', flaking: '#F39C12', detachment: '#E67E22',
  salt_efflorescence: '#3498DB', pigment_loss: '#9B59B6', fading: '#8E44AD',
  soiling: '#7F8C8D', mold: '#27AE60', insect_damage: '#2ECC71', root_damage: '#16A085',
};

/** 将后端 DetectionResult 转为前端展示用的 DetectionBox */
function toDetectionBox(r: DetectionResult): DetectionBox {
  const pts = r.coordinates.points;
  const xs = pts.map((p) => p[0] * 100);
  const ys = pts.map((p) => p[1] * 100);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return {
    label: DAMAGE_TYPE_MAP[r.damageType]?.label || r.damageType,
    color: DAMAGE_COLORS[r.damageType] || '#E74C3C',
    x: minX, y: minY, w: maxX - minX, h: maxY - minY,
    confidence: r.confidence,
  };
}

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [selectedMuralId, setSelectedMuralId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detections, setDetections] = useState<DetectionBox[]>([]);
  const [rawResults, setRawResults] = useState<DetectionResult[]>([]);
  const [hasResult, setHasResult] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载壁画列表供选择
  useEffect(() => {
    getMurals({ pageSize: 200 }).then((res) => setMurals(res.data || [])).catch(() => {});
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { message.warning('请上传图像文件'); return; }
    setImageUrl(URL.createObjectURL(file));
    setImageFile(file);
    setDetections([]);
    setRawResults([]);
    setHasResult(false);
    setIsMock(false);
    setReport(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // AI 检测
  const handleDetect = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      // 如果选了壁画，先上传图像到壁画记录
      let imageUrlForDetect = '';
      if (selectedMuralId) {
        try {
          const uploaded = await uploadMuralImage(selectedMuralId, imageFile, 'visible') as { filePath?: string };
          imageUrlForDetect = uploaded?.filePath || '';
        } catch { /* 上传失败不阻塞检测 */ }
      }

      const results = await detectDamage({ imageUrl: imageUrlForDetect || imageUrl });
      setRawResults(results);
      setDetections(results.map(toDetectionBox));
      setHasResult(true);
      setIsMock(false);
      message.success(`AI 检测完成，发现 ${results.length} 处病害`);
    } catch {
      // AI 不可用，使用 mock 数据演示
      setDetections(MOCK_DETECTIONS);
      setRawResults([]);
      setHasResult(true);
      setIsMock(true);
      message.info('AI 服务暂不可用，展示模拟检测结果');
    } finally {
      setAnalyzing(false);
    }
  };

  // 生成报告
  const handleReport = async () => {
    if (!selectedMuralId) { message.warning('请先选择关联壁画'); return; }
    try {
      const res = await generateReport(selectedMuralId);
      setReport(res);
      message.success('报告生成成功');
    } catch {
      message.warning('报告生成服务暂不可用');
    }
  };

  // 下载报告为 Markdown 文件
  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([report.reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.muralName || '壁画'}_病害检测报告.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 转为病害标注
  const handleConvertToAnnotation = async () => {
    if (!selectedMuralId) { message.warning('请先选择关联壁画'); return; }
    if (isMock || rawResults.length === 0) {
      message.warning('当前为模拟数据，无法转为标注。请在 AI 可用时重新检测。');
      return;
    }
    try {
      const res = await confirmDetection({ muralId: selectedMuralId, results: rawResults });
      message.success(`已创建 ${res.count} 条病害标注`);
      navigate(`/murals/${selectedMuralId}`);
    } catch {
      message.error('转为标注失败');
    }
  };

  const handleReUpload = () => {
    setImageUrl('');
    setImageFile(null);
    setDetections([]);
    setRawResults([]);
    setHasResult(false);
    setIsMock(false);
    setReport(null);
    fileInputRef.current?.click();
  };

  return (
    <div className="analysis-page">
      <div className="analysis-bg-decor" />

      <h1 className="analysis-page-title">图像分析</h1>

      {/* AI 功能提示 */}
      <div className="analysis-tip-card">
        <div className="analysis-tip-icon"><InfoCircleOutlined /></div>
        <div className="analysis-tip-content">
          <span className="analysis-tip-title">AI 图像分析功能</span>
          <span className="analysis-tip-sep">——</span>
          <span className="analysis-tip-desc">
            选择关联壁画后上传图像，AI 将自动检测病害区域。检测结果确认后可直接转为病害标注记录。
          </span>
        </div>
        <div className="analysis-tip-line" />
      </div>

      {/* 壁画选择器 */}
      <div className="mb-4">
        <Select
          showSearch
          allowClear
          placeholder="选择关联壁画（可搜索）"
          className="!w-80"
          value={selectedMuralId || undefined}
          onChange={(v) => setSelectedMuralId(v || '')}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
          }
          options={murals.map((m) => ({ value: m.id, label: `${m.name}（${m.site}）` }))}
        />
      </div>

      {/* 主内容区 */}
      <div className="analysis-main-grid">
        {/* 左侧：图像上传 */}
        <div className="analysis-glass-card">
          <h2 className="analysis-card-title">图像上传</h2>
          <div
            className="analysis-upload-zone"
            onClick={() => !imageUrl && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
            />
            {imageUrl ? (
              <img src={imageUrl} alt="待分析壁画" className="analysis-preview-img" />
            ) : (
              <div className="analysis-upload-placeholder">
                <div className="analysis-upload-bg-pattern" />
                <div className="analysis-upload-icon-wrapper">
                  <CloudUploadOutlined className="analysis-upload-icon" />
                </div>
                <p className="analysis-upload-text">点击或拖拽上传壁画图像</p>
              </div>
            )}
          </div>
          <div className="analysis-card-actions">
            <Button className="analysis-btn-primary" icon={<ExperimentOutlined />}
              loading={analyzing} disabled={!imageUrl} onClick={handleDetect}>
              AI 检测
            </Button>
            <Button className="analysis-btn-outline" icon={<FileTextOutlined />}
              disabled={!selectedMuralId} onClick={handleReport}>
              生成报告
            </Button>
          </div>
        </div>

        {/* 右侧：检测结果 */}
        <div className="analysis-glass-card">
          <h2 className="analysis-card-title">
            检测结果
            {isMock && <span className="text-xs text-text-light ml-2">（模拟数据）</span>}
          </h2>
          <div className="analysis-result-zone">
            {analyzing ? (
              <div className="analysis-result-empty">
                <Spin size="large" />
                <p className="mt-3 text-text-secondary">AI 正在分析图像...</p>
              </div>
            ) : hasResult && imageUrl ? (
              <div className="analysis-result-image-wrapper">
                <img src={imageUrl} alt="检测结果" className="analysis-result-img" />
                {detections.map((d, i) => (
                  <div key={i} className="analysis-detection-box"
                    style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%`,
                      borderColor: d.color, boxShadow: `0 0 8px ${d.color}40` }}>
                    <span className="analysis-detection-label" style={{ backgroundColor: d.color }}>
                      {d.label}{d.confidence ? ` ${(d.confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-result-empty">
                <ExperimentOutlined className="analysis-result-empty-icon" />
                <p>上传图像并点击「AI 检测」查看结果</p>
                <p className="analysis-result-empty-sub">AI 服务不可用时，请前往壁画详情页使用手动标注工具</p>
              </div>
            )}
          </div>

          {/* 报告预览 */}
          {report && (
            <div className="mt-3 p-3 bg-bg-cream rounded-lg text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-text-primary">检测报告：{report.muralName}</span>
                <Button size="small" icon={<ExportOutlined />} onClick={handleDownloadReport}>下载</Button>
              </div>
              <div className="text-text-secondary text-xs">
                病害总数：{report.totalDamages} · 平均严重度：{report.avgSeverity.toFixed(1)}/5
              </div>
            </div>
          )}

          {hasResult && (
            <div className="analysis-card-actions analysis-card-actions-three">
              <Button className="analysis-btn-outline" icon={<ReloadOutlined />} onClick={handleReUpload}>
                重新上传
              </Button>
              <Button className="analysis-btn-outline" icon={<ExportOutlined />}
                disabled={!selectedMuralId} onClick={handleReport}>
                导出报告
              </Button>
              <Button className="analysis-btn-primary" icon={<TagsOutlined />}
                disabled={isMock || !selectedMuralId} onClick={handleConvertToAnnotation}>
                转为病害标注
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="analysis-bottom-decor" />
    </div>
  );
}
