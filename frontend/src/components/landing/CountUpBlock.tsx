import { useCallback, useRef, useState } from 'react';

/**
 * 数字计数动画组件
 * 进入视口时从 0 平滑增长到目标值
 */
export default function CountUpBlock({
  target,
  label,
  duration = 2000,
  className = '',
}: {
  target: number;
  label: string;
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
      <div className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
        {displayValue}
      </div>
      <div className="text-text-secondary text-sm mt-2 tracking-wide">{label}</div>
    </div>
  );
}
