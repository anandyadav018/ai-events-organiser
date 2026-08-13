"use client";

import { useState, useEffect, useCallback } from "react";

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  url: string,
  options?: RequestInit,
  dependencies: any[] = [],
  skip: boolean = false
): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (skip) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type");
      let json: any = {};

      if (contentType && contentType.includes("application/json")) {
        json = await response.json();
      } else {
        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || "An error occurred");
      }
      
      setData(json.data);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [url, skip, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
