import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Image, Result, Spin, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getMural } from '@/api/mural';
import type { MuralRecord } from '@/types';
import {
  getPrimaryRestoredImage,
  getSecondaryRestoredImage,
  getShowcaseDetailState,
  getShowcaseText,
} from './showcaseUtils';
import './showcase.css';

const narrativeSections = [
  { key: 'popularIntroduction', label: '通俗化介绍' },
  { key: 'historicalBackground', label: '历史背景' },
  { key: 'artisticFeatures', label: '艺术特点' },
  { key: 'culturalSignificance', label: '文化意义' },
] as const;

export default function ShowcaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mural, setMural] = useState<MuralRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMural() {
      if (!id) {
        if (active) {
          setMural(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const result = await getMural(id);
        if (active) {
          setMural(result);
        }
      } catch {
        if (active) {
          setMural(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMural();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="showcase-loading">
        <Spin size="large" />
      </div>
    );
  }

  const detailState = getShowcaseDetailState(mural);

  if (detailState === 'missing') {
    return (
      <div className="showcase-page">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/showcase')}>
          返回成果列表
        </Button>
        <div className="showcase-empty">
          <Empty description="未找到对应的修复成果" />
        </div>
      </div>
    );
  }

  if (detailState === 'unavailable') {
    return (
      <div className="showcase-page">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/showcase')}>
          返回成果列表
        </Button>
        <Result
          status="info"
          title="该壁画暂未进入修复成果展示"
          subTitle="只有修复状态为“已完成”的壁画才会出现在展示页。"
        />
      </div>
    );
  }

  const readyMural = mural;
  if (!readyMural) {
    return null;
  }

  const primaryImage = getPrimaryRestoredImage(readyMural);
  const secondaryImage = getSecondaryRestoredImage(readyMural);
  const primarySrc = primaryImage ? `/uploads/${primaryImage.filePath}` : null;
  const secondarySrc = secondaryImage ? `/uploads/${secondaryImage.filePath}` : null;

  return (
    <div className="showcase-page showcase-detail">
      <div className="showcase-detail__header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/showcase')}>
          返回成果列表
        </Button>
        <Tag color="success" bordered={false}>已完成修复</Tag>
      </div>

      <section className="showcase-detail__layout">
        <div className="showcase-panel showcase-panel--media">
          <div className="showcase-panel__eyebrow">Primary Restored View</div>
          {primarySrc ? (
            <Image
              className="showcase-detail__image"
              src={primarySrc}
              alt={`${readyMural.name} 主修复成果图`}
            />
          ) : (
            <div className="showcase-card__placeholder showcase-card__placeholder--large">暂无修复成果图</div>
          )}
        </div>

        <div className="showcase-panel showcase-detail__summary">
          <div className="showcase-panel__eyebrow">Narrative Overview</div>
          <h1 className="showcase-detail__title">{readyMural.name}</h1>
          <div className="showcase-detail__meta">
            <span>{readyMural.era}</span>
            <span>{readyMural.site}</span>
            <span>{readyMural.material}</span>
          </div>
          <p className="showcase-detail__lead">{getShowcaseText(readyMural.popularIntroduction)}</p>
        </div>
      </section>

      <section className="showcase-narratives">
        {narrativeSections.map((section) => (
          <article key={section.key} className="showcase-panel showcase-panel--narrative">
            <div className="showcase-panel__eyebrow">{section.label}</div>
            <p className="showcase-panel__body">
              {getShowcaseText(readyMural[section.key])}
            </p>
          </article>
        ))}
      </section>

      <section className="showcase-gallery">
        <article className="showcase-panel showcase-panel--media">
          <div className="showcase-panel__eyebrow">Secondary View</div>
          {secondarySrc ? (
            <Image
              className="showcase-detail__image"
              src={secondarySrc}
              alt={`${readyMural.name} 次修复成果图`}
            />
          ) : (
            <div className="showcase-card__placeholder showcase-card__placeholder--large">暂无补充成果图</div>
          )}
        </article>
        <article className="showcase-panel">
          <div className="showcase-panel__eyebrow">展陈摘要</div>
          <dl className="showcase-summary-list">
            <div>
              <dt>墓葬位置</dt>
              <dd>{readyMural.tombLocation || '暂无内容'}</dd>
            </div>
            <div>
              <dt>尺寸</dt>
              <dd>{readyMural.dimensions || '暂无内容'}</dd>
            </div>
            <div>
              <dt>基础描述</dt>
              <dd>{getShowcaseText(readyMural.description)}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
