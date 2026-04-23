import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Empty, Image, Result, Spin, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getMural } from '@/api/mural';
import type { MuralRecord } from '@/types';
import {
  getShowcaseFallbackMural,
  getShowcaseFallbackMurals,
  getShowcaseImageSrc,
  getPrimaryRestoredImage,
  getPrimaryVisibleImage,
  getShowcaseDetailState,
  getShowcaseText,
  isCompleteShowcaseMural,
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
  const [usingFallback, setUsingFallback] = useState(false);

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
          if (result.status === 'completed' && !isCompleteShowcaseMural(result)) {
            const fallbackMural = getShowcaseFallbackMural(id) ?? getShowcaseFallbackMurals()[0] ?? null;
            setMural(fallbackMural);
            setUsingFallback(Boolean(fallbackMural));
          } else {
            setMural(result);
            setUsingFallback(false);
          }
        }
      } catch {
        if (active) {
          const fallbackMural = getShowcaseFallbackMural(id);
          setMural(fallbackMural);
          setUsingFallback(Boolean(fallbackMural));
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
  const beforeImage = getPrimaryVisibleImage(readyMural);
  const afterImage = primaryImage;
  const primarySrc = getShowcaseImageSrc(primaryImage?.filePath);
  const beforeSrc = getShowcaseImageSrc(beforeImage?.filePath);
  const afterSrc = getShowcaseImageSrc(afterImage?.filePath);

  return (
    <div className="showcase-page showcase-detail">
      <div className="showcase-detail__header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/showcase')}>
          返回成果列表
        </Button>
        <Tag color="success" bordered={false}>已完成修复</Tag>
      </div>

      {usingFallback && (
        <Alert
          className="showcase-fallback-alert"
          type="info"
          showIcon
          message="当前展示示例数据"
          description="真实接口可用且存在该壁画记录后，详情页会展示后端维护的修复成果内容。"
        />
      )}

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
          <dl className="showcase-summary-list showcase-summary-list--inline">
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
        </div>
      </section>

      <section className="showcase-comparison">
        <article className="showcase-panel showcase-panel--media showcase-comparison__panel">
          <div className="showcase-panel__eyebrow">Before Restoration</div>
          <h2 className="showcase-comparison__title">修复前</h2>
          {beforeSrc ? (
            <Image
              className="showcase-detail__image"
              src={beforeSrc}
              alt={`${readyMural.name} 修复前对比图`}
            />
          ) : (
            <div className="showcase-card__placeholder showcase-card__placeholder--large">暂无修复前图</div>
          )}
        </article>

        <article className="showcase-panel showcase-panel--media showcase-comparison__panel">
          <div className="showcase-panel__eyebrow">After Restoration</div>
          <h2 className="showcase-comparison__title">修复后</h2>
          {afterSrc ? (
            <Image
              className="showcase-detail__image"
              src={afterSrc}
              alt={`${readyMural.name} 修复后对比图`}
            />
          ) : (
            <div className="showcase-card__placeholder showcase-card__placeholder--large">暂无修复后图</div>
          )}
        </article>
      </section>

      <section className="showcase-panel showcase-narratives">
        <div className="showcase-panel__eyebrow">Narrative Chapters</div>
        <div className="showcase-narratives__list">
          {narrativeSections.map((section, index) => {
            const chapterNumber = String(index + 1).padStart(2, '0');
            const chapterAlignment = index % 2 === 0 ? 'start' : 'end';

            return (
              <article
                key={section.key}
                className={`showcase-narratives__chapter showcase-narratives__chapter--${chapterAlignment}`}
              >
                <div className="showcase-narratives__rail" aria-hidden="true">
                  <span className="showcase-narratives__node">{chapterNumber}</span>
                </div>
                <div className="showcase-narratives__card">
                  <div className="showcase-narratives__chapter-label">Chapter {chapterNumber}</div>
                  <h2 className="showcase-narratives__chapter-title">{section.label}</h2>
                  <p className="showcase-panel__body">
                    {getShowcaseText(readyMural[section.key])}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
