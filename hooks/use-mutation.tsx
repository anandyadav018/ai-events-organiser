"use client";

import { useState } from "react";

interface MutationResult<TData, TVariables> {
  mutate: (variables?: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
}

export function useMutation<TData = any, TVariables = any>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
): MutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables?: TVariables): Promise<TData> => {
    try {
      setIsLoading(true);
      setError(null);

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (variables) {
        // Handle query params vs body depending on method
        if (method === "DELETE") {
          // If DELETE, variables might be passed in URL instead of body for our API design
          // In some implementations DELETE can have a body, but typically params go in URL
        } else {
          options.body = JSON.stringify(variables);
        }
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type");
      let json: any = {};

      if (contentType && contentType.includes("application/json")) {
        json = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
        json = { data: text };
      }

      if (!response.ok || (json.hasOwnProperty("success") && !json.success)) {
        throw new Error(json.error || "An error occurred during mutation");
      }

      return json.data || json;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
