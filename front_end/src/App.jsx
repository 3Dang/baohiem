import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { router } from '@/app/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dữ liệu nghiệp vụ thay đổi qua thao tác của người dùng
      // tự làm mới khi chuyển tab; các mutation đã chủ động invalidate.
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      // 401/403/422 không đáng thử lại; chỉ retry một lần cho lỗi mạng/5xx
      retry: (failureCount, error) =>
        failureCount < 1 && ![401, 403, 422].includes(error?.status),
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
