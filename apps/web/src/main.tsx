import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import App from './App';
import './index.css';
import { AppThemeProvider } from './theme/AppThemeProvider';
import { AuthProvider } from './hooks/AuthProvider';
import { SocketProvider } from './hooks/SocketProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider autoHideDuration={3500} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </AppThemeProvider>
  </React.StrictMode>,
);
