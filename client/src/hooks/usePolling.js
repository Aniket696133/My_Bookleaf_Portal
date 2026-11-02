import { useEffect, useRef } from 'react';

// Calls fn immediately and then every `ms` while the tab is visible (near-real-time updates).
export default function usePolling(fn, ms, deps = []) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    const run = () => {
      if (!document.hidden) saved.current().catch(() => {});
    };
    run();
    const id = setInterval(run, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}
