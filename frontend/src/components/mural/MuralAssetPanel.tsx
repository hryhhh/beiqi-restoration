import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Empty,
  Popconfirm,
  Segmented,
  Tag,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { deleteMuralAsset, setDefaultMuralAsset, uploadMuralAsset } from '@/api/mural';
import { ASSET_TYPE_MAP } from '@/constants';
import type { AssetType, MuralAsset } from '@/types';
import ModelViewer from './ModelViewer';
import PanoramaViewer from './PanoramaViewer';

interface Props {
  muralId: string;
  assets: MuralAsset[];
  onChange: () => void;
}

const ASSET_ACCEPT: Record<AssetType, string> = {
  model: '.glb,model/gltf-binary',
  panorama: 'image/jpeg,image/png,image/webp',
};

function formatFileSize(fileSize: number): string {
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  if (fileSize < 1024 * 1024 * 1024) return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  return `${(fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getAssetHint(assetType: AssetType): string {
  return assetType === 'model'
    ? '支持 .glb，单文件不超过 100MB。'
    : '支持 jpg / jpeg / png / webp，单文件不超过 25MB。';
}

function sortAssets(items: MuralAsset[]): MuralAsset[] {
  return [...items].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.version - a.version;
  });
}

export default function MuralAssetPanel({ muralId, assets, onChange }: Props) {
  const { message } = App.useApp();
  const [assetType, setAssetType] = useState<AssetType>('model');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentAssets = useMemo(
    () => sortAssets(assets.filter((asset) => asset.assetType === assetType)),
    [assets, assetType],
  );

  const selectedAsset = currentAssets.find((asset) => asset.id === selectedId)
    || currentAssets.find((asset) => asset.isDefault)
    || currentAssets[0]
    || null;

  useEffect(() => {
    if (assetType === 'model' && currentAssets.length === 0 && assets.some((asset) => asset.assetType === 'panorama')) {
      setAssetType('panorama');
    }
    if (assetType === 'panorama' && currentAssets.length === 0 && assets.some((asset) => asset.assetType === 'model')) {
      setAssetType('model');
    }
  }, [assetType, assets, currentAssets.length]);

  useEffect(() => {
    if (!selectedAsset) {
      setSelectedId(null);
      return;
    }
    if (selectedId !== selectedAsset.id) {
      setSelectedId(selectedAsset.id);
    }
  }, [selectedAsset, selectedId]);

  const handleUpload = async (file: File) => {
    await uploadMuralAsset(muralId, file, assetType, { makeDefault: currentAssets.length === 0 });
    message.success('资源上传成功');
    onChange();
  };

  const handleDelete = async (assetId: string) => {
    try {
      await deleteMuralAsset(muralId, assetId);
      message.success('资源已删除');
      onChange();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSetDefault = async (assetId: string) => {
    try {
      await setDefaultMuralAsset(muralId, assetId);
      message.success('已设为默认资源');
      onChange();
    } catch {
      message.error('设置默认资源失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3">
        <div>
          <div className="text-sm font-medium text-text-primary">3D 模型 / 全景资源</div>
          <div className="mt-1 text-xs text-text-secondary">{getAssetHint(assetType)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<AssetType>
            value={assetType}
            onChange={(value) => setAssetType(value)}
            options={[
              { label: ASSET_TYPE_MAP.model, value: 'model' },
              { label: ASSET_TYPE_MAP.panorama, value: 'panorama' },
            ]}
          />
          <Upload
            accept={ASSET_ACCEPT[assetType]}
            showUploadList={false}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await handleUpload(file as File);
                onSuccess?.({});
              } catch (error) {
                onError?.(error as Error);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>上传资源</Button>
          </Upload>
        </div>
      </div>

      {currentAssets.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-[0_14px_40px_rgba(81,57,33,0.08)]">
            {selectedAsset?.assetType === 'model' ? (
              <ModelViewer
                key={selectedAsset.id}
                src={`/uploads/${selectedAsset.filePath}`}
                title={selectedAsset.name}
              />
            ) : (
              <PanoramaViewer
                key={selectedAsset?.id}
                src={`/uploads/${selectedAsset?.filePath}`}
                title={selectedAsset?.name || 'panorama'}
              />
            )}

            {selectedAsset && (
              <div className="border-t border-[#eadfce] bg-[#fffcf7] px-4 py-3 text-sm text-text-secondary">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color={selectedAsset.isDefault ? 'gold' : 'default'}>
                    {selectedAsset.isDefault ? '默认资源' : '候选资源'}
                  </Tag>
                  <Tag>{ASSET_TYPE_MAP[selectedAsset.assetType]}</Tag>
                  <Tag>v{selectedAsset.version}</Tag>
                  <span>{formatFileSize(selectedAsset.fileSize)}</span>
                  {selectedAsset.width > 0 && selectedAsset.height > 0 && (
                    <span>{selectedAsset.width} x {selectedAsset.height}</span>
                  )}
                </div>
                <div className="mt-2">
                  上传时间：{new Date(selectedAsset.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#eadfce] bg-white">
            <div className="border-b border-[#eadfce] bg-[#fcfaf6] px-4 py-3 text-sm font-medium text-text-primary">
              资源列表（{currentAssets.length}）
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {currentAssets.map((asset) => {
                const active = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    role="button"
                    tabIndex={0}
                    className={`w-full cursor-pointer border-b border-[#f0e7d9] px-4 py-3 text-left transition ${
                      active ? 'bg-[#f8f1e5]' : 'bg-white hover:bg-[#fcfaf6]'
                    }`}
                    onClick={() => setSelectedId(asset.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(asset.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-text-primary">{asset.name}</div>
                        <div className="mt-1 text-xs text-text-secondary">
                          v{asset.version} · {formatFileSize(asset.fileSize)}
                        </div>
                      </div>
                      {asset.isDefault && <Tag color="gold">默认</Tag>}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {!asset.isDefault ? (
                        <Button
                          size="small"
                          icon={<StarOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleSetDefault(asset.id);
                          }}
                        >
                          设为默认
                        </Button>
                      ) : (
                        <Button size="small" icon={<StarFilled />} disabled>
                          默认资源
                        </Button>
                      )}
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        href={`/uploads/${asset.filePath}`}
                        target="_blank"
                        onClick={(event) => event.stopPropagation()}
                      >
                        打开文件
                      </Button>
                      <Popconfirm
                        title="确认删除该资源？"
                        description="删除后不可恢复。"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => void handleDelete(asset.id)}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(event) => event.stopPropagation()}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Empty
          description={`当前还没有${ASSET_TYPE_MAP[assetType]}资源`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
}
