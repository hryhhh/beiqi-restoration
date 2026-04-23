import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Card, Empty, Pagination, Spin, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getMurals } from '@/api/mural';
import type { MuralRecord } from '@/types';
import { buildShowcaseCardPreview } from './showcaseUtils';
import './showcase.css';

const DEFAULT_PAGE_SIZE = 12;

export default function ShowcaseListPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [murals, setMurals] = useState<MuralRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadShowcase() {
      setLoading(true);
      try {
        const result = await getMurals({ status: 'completed', page, pageSize });
        if (!active) {
          return;
        }

        setMurals(result.data.filter((mural) => mural.status === 'completed'));
        setTotal(result.total);
      } catch {
        if (active) {
          setMurals([]);
          setTotal(0);
          message.error('加载修复成果失败');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadShowcase();

    return () => {
      active = false;
    };
  }, [message, page, pageSize]);

  const previews = murals.map(buildShowcaseCardPreview);

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div className="showcase-hero__eyebrow">Repair Showcase</div>
        <div className="showcase-hero__content">
          <div>
            <h1 className="showcase-hero__title">修复结果展示</h1>
            <p className="showcase-hero__subtitle">
              仅呈现已完成修复的壁画成果，聚焦修复后图像、公众介绍与研究叙述。
            </p>
          </div>
          <div className="showcase-hero__stats">
            <span className="showcase-hero__stat-value">{total}</span>
            <span className="showcase-hero__stat-label">当前已完成修复条目</span>
          </div>
        </div>
      </section>

      <Spin spinning={loading}>
        {previews.length ? (
          <>
            <div className="showcase-grid">
              {previews.map((preview) => (
                <Card
                  key={preview.id}
                  hoverable
                  className="showcase-card"
                  onClick={() => navigate(`/showcase/${preview.id}`)}
                >
                  <div className="showcase-card__media">
                    {preview.imageSrc ? (
                      <img src={preview.imageSrc} alt={`${preview.name} 修复成果`} />
                    ) : (
                      <div className="showcase-card__placeholder">暂无修复成果图</div>
                    )}
                  </div>
                  <div className="showcase-card__meta">
                    <div>
                      <h2 className="showcase-card__title">{preview.name}</h2>
                      <div className="showcase-card__era">{preview.era}</div>
                    </div>
                    <Tag color="success" bordered={false}>已完成</Tag>
                  </div>
                  <p className="showcase-card__summary">{preview.summary}</p>
                  <div className="showcase-card__footer">
                    <span>查看详细成果</span>
                    <Button type="text" icon={<ArrowRightOutlined />} tabIndex={-1}>
                      进入
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {total > pageSize && (
              <div className="showcase-pagination">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showTotal={(count) => `共 ${count} 条`}
                  onChange={(nextPage, nextPageSize) => {
                    setPage(nextPage);
                    setPageSize(nextPageSize);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="showcase-empty">
            <Empty description="暂无可展示的修复成果" />
          </div>
        )}
      </Spin>
    </div>
  );
}
