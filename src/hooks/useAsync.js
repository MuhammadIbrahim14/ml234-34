import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal async data hook: loads on mount / when deps change.
 * `loader` should return `{ data, error }`.
 */
export function useAsync(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result?.data ?? null);
      setError(result?.error || null);
    } catch (e) {
      setData(null);
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (cancelled) return;
        setData(result?.data ?? null);
        setError(result?.error || null);
      } catch (e) {
        if (cancelled) return;
        setData(null);
        setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
