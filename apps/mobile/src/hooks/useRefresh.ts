import { useCallback, useState } from 'react';

/**
 * Shared pull-to-refresh hook. Simulates a network refresh with
 * a minimum display time so the spinner is visible even on instant responses.
 */
export function useRefresh(minimumMs = 800) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), minimumMs);
  }, [minimumMs]);

  return { refreshing, onRefresh };
}
