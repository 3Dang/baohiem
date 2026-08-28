import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from './AuthContext';

/**
 * Chặn các route cần đăng nhập. Trong lúc đang xác minh token sẵn có thì
 * hiện spinner, tránh nháy sang /login rồi lại quay về.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Ghi lại trang đang muốn vào để đăng nhập xong quay lại đúng chỗ
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return <Outlet />;
}
