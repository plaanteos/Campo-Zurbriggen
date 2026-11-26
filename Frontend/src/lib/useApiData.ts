import { useCallback, useEffect, useState } from "react";
import { ApiError, apiGet } from "./api";

export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resultado = await apiGet<T>(path);
      setData(resultado);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
