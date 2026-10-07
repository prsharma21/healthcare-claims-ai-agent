import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  /** Runs the loader again. Existing data stays visible while reloading. */
  reload: () => void;
  setData: (data: T) => void;
}

/** Loads data from a service function and tracks loading / error state. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    loaderRef.current().then(
      (result) => {
        if (cancelled) return;
        setData(result);
        setIsLoading(false);
      },
      (loadError: unknown) => {
        if (cancelled) return;
        setError(loadError);
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, isLoading, reload, setData };
}
