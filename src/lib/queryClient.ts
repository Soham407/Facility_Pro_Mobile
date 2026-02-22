import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately, refresh in background
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 30, // 30 min garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
      // Offline: serve from cache, don't error
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
