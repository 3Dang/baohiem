import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import CatalogPage, { CATALOG_TYPES } from '@/features/catalog/CatalogPage';
import SettingsListPage from '@/features/settings/SettingsListPage';
import SystemSettingsPage from '@/features/settings/SystemSettingsPage';
import ReportPage from '@/features/reports/ReportPage';
import SummaryReportPage from '@/features/reports/SummaryReportPage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import SearchPage from '@/features/search/SearchPage';
import NotFoundPage from '@/features/misc/NotFoundPage';
import { AuditLogsPage, SystemLogsPage } from '@/features/logs/pages';
import {
  ARExportPage,
  ARImportPage,
  D03ExportPage,
  D03ImportPage,
  D05ExportPage,
  D05ImportPage,
} from '@/features/declarations/pages';
import {
  AgentsPage,
  BaseSalaryPage,
  EReceiptsPage,
  InsuranceHistoryPage,
  InsuranceReceiptsPage,
  PaymentsPage,
  PermissionsPage,
  ReceiptBooksPage,
  ReceiptsPage,
  RolesPage,
} from '@/features/business/pages';

/** Các danh mục dùng chung một component, khác nhau ở `type`. */
const CATALOG_ROUTES = CATALOG_TYPES.map((type) => ({
  path: `catalog/${type}`,
  element: <CatalogPage type={type} />,
}));

/**
 * Nhập/xuất hồ sơ kê khai. Mỗi mẫu biểu có hai trang danh sách riêng: trang
 * nhập để tạo và sửa dữ liệu, trang xuất để lọc rồi kết xuất gửi cơ quan BHXH.
 */
const DECLARATION_ROUTES = [
  { path: 'declarations/d03/import', element: <D03ImportPage /> },
  { path: 'declarations/d03/export', element: <D03ExportPage /> },
  { path: 'declarations/ar/import', element: <ARImportPage /> },
  { path: 'declarations/ar/export', element: <ARExportPage /> },
  { path: 'declarations/d05/import', element: <D05ImportPage /> },
  { path: 'declarations/d05/export', element: <D05ExportPage /> },
];

/** Báo cáo theo loại hồ sơ. */
const REPORT_ROUTES = [
  { path: 'reports/d03', element: <ReportPage title="Báo cáo D03 - BHYT" type="d03" /> },
  { path: 'reports/ar', element: <ReportPage title="Báo cáo AR - BHYT" type="ar" /> },
  { path: 'reports/d05', element: <ReportPage title="Báo cáo D05 - BHXH" type="d05" /> },
  // Báo cáo tổng hợp có hai bảng và bộ lọc riêng nên là trang riêng
  { path: 'reports/summary', element: <SummaryReportPage /> },
];

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Mọi route bên dưới đều yêu cầu đăng nhập
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },

          { path: 'base-salary', element: <BaseSalaryPage /> },
          { path: 'insurance-receipts', element: <InsuranceReceiptsPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'receipts', element: <ReceiptsPage /> },
          { path: 'e-receipts', element: <EReceiptsPage /> },
          { path: 'receipt-books', element: <ReceiptBooksPage /> },
          { path: 'permissions', element: <PermissionsPage /> },
          { path: 'roles', element: <RolesPage /> },
          { path: 'agents', element: <AgentsPage /> },
          { path: 'insurance-history', element: <InsuranceHistoryPage /> },

          ...CATALOG_ROUTES,
          ...DECLARATION_ROUTES,
          ...REPORT_ROUTES,

          // "Cài đặt" là tham số tính toán; "Cài đặt hệ thống" là tham số vận hành
          { path: 'settings', element: <SettingsListPage /> },
          { path: 'system-settings', element: <SystemSettingsPage /> },
          { path: 'system-logs', element: <SystemLogsPage /> },
          { path: 'audit-logs', element: <AuditLogsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'search', element: <SearchPage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  // Đường dẫn lạ ngoài khu vực quản trị: đưa về trang chủ để ProtectedRoute quyết định
  { path: '*', element: <Navigate to="/" replace /> },
]);
