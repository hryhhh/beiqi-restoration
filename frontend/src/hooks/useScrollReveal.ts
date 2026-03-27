import { useEffect, useRef } from 'react';

/**
 * 视口进入动画 hook
 * 当元素进入视口时添加 'visible' class 触发 CSS 动画
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        }
      },
      { threshold: 0.15 },
    );

    // 观察容器内所有带 animate-on-scroll 的子元素
    const targets = el.querySelectorAll('.animate-on-scroll');
    targets.forEach((t) => observer.observe(t));
    // 也观察容器本身
    if (el.classList.contains('animate-on-scroll')) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
