import { useEffect } from 'react';

/** Adds `.in` to `.reveal` elements as they enter the viewport (all at once if IO is unavailable). */
export function useReveals(routeKey = 'home') {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('in'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [routeKey]);
}
