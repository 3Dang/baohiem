import { Link } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';

/** Trang 404 trong khu vực quản trị. */
export default function NotFoundPage() {
  return (
    <EmptyState
      icon="warning"
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại hoặc bạn không có quyền truy cập."
      action={
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          Về bảng điều khiển
        </Link>
      }
    />
  );
}
