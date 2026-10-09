import { useEffect, useState } from "react";
import { api } from "../api";

import type { MetricsResponse } from "../types";

export function useMetrics(pollMs = 3000) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const res = await api.metrics();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "metrics error");
      }
    };

    fetch();
    const id = setInterval(fetch, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { metrics: data?.metrics ?? [], latest: data?.latest ?? null, error };
}
