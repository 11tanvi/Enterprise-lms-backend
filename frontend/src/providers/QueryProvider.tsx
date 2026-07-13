import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize a standard new QueryClient for standard Vite SPA
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute stale time
      refetchOnWindowFocus: false, // Avoid aggressive refetches on window focus
      retry: 1, // Only retry failed requests once
      refetchOnReconnect: 'always',
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider wraps the root component to enable React Query hooks across the app.
 * Built for standard React/Vite SPAs.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
