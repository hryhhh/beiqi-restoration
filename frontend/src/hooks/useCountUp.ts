import { useCallback, useRef, useState } from 'react';

/**
 * 数字计数动画 hook
 * 返回回调 ref（用于 JSX ref 属性）和当前显示值
 */
export function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      if (started.current) return;

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
              setValue(Math.round(eased * target));
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

  return { ref: callbackRef, value };
}
