import { useCallback, useRef, useState } from 'react';

/**
 * 数字计数动画组件 — 金色渐变大字
 */
export default function CountUpBlock({
  target,
  label,
  suffix = '',
  icon,
  duration = 2000,
  className = '',
}: {
  target: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  duration?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const started = useRef(false);

  const nodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || started.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !started.current) {
            started.current = true;
            observer.disconnect();
            const start = performance.now();

            const tick = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplayValue(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
          }
        },
        { threshold: 0.3 },
      );

      observer.observe(node);
    },
    [target, duration],
  );

  return (
    <div ref={nodeRef} className={className}>
      {icon && <div className="text-2xl mb-3" style={{ color: '#C9A66B' }}>{icon}</div>}
      <div className="stat-number">
        {displayValue.toLocaleString()}{suffix}
      </div>
      <div className="text-text-secondary text-sm mt-3 tracking-wide">{label}</div>
    </div>
  );
}
