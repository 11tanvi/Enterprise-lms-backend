import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAuthenticatedQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = []
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { logout, showToast } = useApp();
  const navigate = useNavigate();

  const queryFnRef = useRef(queryFn);
  const actionsRef = useRef({ logout, navigate, showToast });

  useEffect(() => {
    queryFnRef.current = queryFn;
    actionsRef.current = { logout, navigate, showToast };
  });

  const executeQuery = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await queryFnRef.current();
      setData(result);
    } catch (err: any) {
      console.error("[useAuthenticatedQuery] Query execution failed:", err);
      const finalError = err instanceof Error ? err : new Error(String(err?.message || err));
      setError(finalError);
      
      const status = err?.status || err?.response?.status || err?.originalError?.response?.status;
      if (status === 401 || status === 403) {
        actionsRef.current.showToast("Your session has expired. Please sign in again.", "error");
        actionsRef.current.logout();
        actionsRef.current.navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    isLoading,
    error,
    refetch: executeQuery,
  };
}

export default useAuthenticatedQuery;
