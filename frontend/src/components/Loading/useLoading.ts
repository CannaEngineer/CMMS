import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseLoadingOptions {
  initialLoading?: boolean;
  minLoadingTime?: number; // Minimum time to show loading (prevents flashing)
  timeout?: number; // Auto-timeout for loading state
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress?: number;
}

export interface UseLoadingReturn {
  loading: LoadingState;
  startLoading: () => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setError: (error: Error | null) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}

/**
 * useLoading - Custom hook for managing loading states
 * 
 * Features:
 * - Prevents loading flashing with minimum display time
 * - Automatic timeout handling
 * - Progress tracking support
 * - Error state management
 * - Wrapper for async operations
 */
export const useLoading = (options: UseLoadingOptions = {}): UseLoadingReturn => {
  const {
    initialLoading = false,
    minLoadingTime = 300, // 300ms minimum to prevent flashing
    timeout = 30000, // 30 second default timeout
  } = options;

  const [loading, setLoading] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined,
  });

  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLoading = useCallback(() => {
    loadingStartTime.current = Date.now();
    setLoading(prev => ({ ...prev, isLoading: true, error: null }));

    // Set timeout if configured
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setLoading(prev => ({
          ...prev,
          isLoading: false,
          error: new Error('Operation timed out'),
        }));
      }, timeout);
    }
  }, [timeout]);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const now = Date.now();
    const startTime = loadingStartTime.current;
    
    if (startTime) {
      const elapsed = now - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      if (remaining > 0) {
        // Ensure minimum loading time
        setTimeout(() => {
          setLoading(prev => ({ ...prev, isLoading: false }));
        }, remaining);
      } else {
        setLoading(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setLoading(prev => ({ ...prev, isLoading: false }));
    }
    
    loadingStartTime.current = null;
  }, [minLoadingTime]);

  const setProgress = useCallback((progress: number) => {
    setLoading(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('An error occurred'));
      throw error;
    }
  }, [startLoading, stopLoading, setError]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    loadingStartTime.current = null;
    setLoading({
      isLoading: false,
      error: null,
      progress: undefined,
    });
  }, []);

  return {
    loading,
    startLoading,
    stopLoading,
    setProgress,
    setError,
    withLoading,
    reset,
  };
};

/**
 * useAsyncOperation - Simplified hook for single async operations
 */
export const useAsyncOperation = <T = any>(options?: UseLoadingOptions) => {
  const { loading, withLoading, setProgress, reset } = useLoading(options);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    return withLoading(operation);
  }, [withLoading]);

  return {
    isLoading: loading.isLoading,
    error: loading.error,
    progress: loading.progress,
    execute,
    setProgress,
    reset,
  };
};

/**
 * useMultipleLoading - Hook for managing multiple loading states
 */
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
};