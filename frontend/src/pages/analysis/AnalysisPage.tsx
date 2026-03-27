import { useState } from 'react';
import { Button, Upload, Card, Alert, message } from 'antd';
import { UploadOutlined, ExperimentOutlined } from '@ant-design/icons';
import { detectDamage, generateReport } from '@/api/analysis';

export default function AnalysisPage() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleDetect = async () => {
    setAnalyzing(true);
    try {
      await detectDamage({ muralId: '', imageId: '' });
    } catch {
      message.warning('AI 检测服务暂不可用，请使用手动标注');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReport = async () => {
    try {
      await generateReport({ muralId: '' });
    } catch {
      message.warning('报告生成服务暂不可用');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">图像分析</h2>

      <Alert
        type="info" showIcon className="mb-4"
        message="AI 图像分析功能"
        description="上传壁画图像，AI 将自动检测病害区域并标注。检测结果确认后可直接转为病害标注记录。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 上传区 */}
        <Card title="图像上传">
          <Upload.Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              setImageUrl(URL.createObjectURL(file));
              return false;
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="待分析图像" className="max-h-64 mx-auto" />
            ) : (
              <div className="py-8">
                <UploadOutlined className="text-4xl text-text-secondary mb-2" />
                <p className="text-text-secondary">点击或拖拽上传壁画图像</p>
              </div>
            )}
          </Upload.Dragger>
          <div className="flex gap-3 mt-4">
            <Button
              type="primary" icon={<ExperimentOutlined />}
              loading={analyzing} disabled={!imageUrl}
              onClick={handleDetect}
            >
              AI 检测
            </Button>
            <Button disabled={!imageUrl} onClick={handleReport}>生成报告</Button>
          </div>
        </Card>

        {/* 检测结果区 */}
        <Card title="检测结果">
          <div className="flex items-center justify-center h-64 text-text-secondary">
            <div className="text-center">
              <ExperimentOutlined className="text-4xl mb-2" />
              <p>上传图像并点击「AI 检测」查看结果</p>
              <p className="text-xs mt-2">AI 服务不可用时，请前往壁画详情页使用手动标注工具</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
