import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';

/**
 * Khung trang sau khi đăng nhập: sidebar cố định + topbar + vùng nội dung.
 *
 * Số liệu badge trên sidebar và số thông báo chưa đọc lấy chung từ
 * GET /dashboard/summary → { badges: {...}, unreadNotifications: number }
 * để không phải gọi nhiều endpoint chỉ vì mấy con số nhỏ.
 */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => http.get(endpoints.dashboard.summary),
    // Số đếm không cần chính xác tuyệt đối; 5 phút là đủ tươi
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        badges={data?.badges}
      />

      {/* lg:pl-64 chừa chỗ cho sidebar cố định trên màn hình lớn */}
      <div className="lg:pl-64">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          unreadCount={data?.unreadNotifications}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
