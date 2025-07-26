// src/hooks/useGeoJson.js
import { useState, useCallback } from "react";

export function useGeoJson(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") ?? "";
      if (!/application\/(geo\+)?json/.test(ct))
        throw new Error(`Invalid content‑type: ${ct}`);
      setData(await res.json());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error, fetchData };
}
