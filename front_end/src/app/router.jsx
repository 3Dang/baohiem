import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import CatalogPage, { CATALOG_TYPES } from '@/features/catalog/CatalogPage';
import SettingsPage from '@/features/settings/SettingsPage';
import ImportPage from '@/features/declarations/ImportPage';
import ExportPage from '@/features/declarations/ExportPage';
import ReportPage from '@/features/reports/ReportPage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import SearchPage from '@/features/search/SearchPage';
import NotFoundPage from '@/features/misc/NotFoundPage';
import { AuditLogsPage, SystemLogsPage } from '@/features/logs/pages';
import { endpoints } from '@/lib/endpoints';
import {
  AgentsPage,
  BaseSalaryPage,
  EReceiptsPage,
  InsuranceHistoryPage,
  InsuranceReceiptsPage,
  PaymentsPage,
  PermissionsPage,
  ReceiptsPage,
  RolesPage,
} from '@/features/business/pages';

/** Các danh mục dùng chung một component, khác nhau ở `type`. */
const CATALOG_ROUTES = CATALOG_TYPES.map((type) => ({
  path: `catalog/${type}`,
  element: <CatalogPage type={type} />,
}));

/** Nhập/xuất hồ sơ kê khai: chỉ khác endpoint và nhãn. */
const DECLARATION_ROUTES = [
  {
    path: 'declarations/d03/import',
    element: (
      <ImportPage
        title="Nhập D03"
        description="Nhập danh sách người tham gia BHYT từ tệp Excel mẫu D03-TS."
        endpoint={endpoints.declarations.d03Import}
      />
    ),
  },
  {
    path: 'declarations/d03/export',
    element: (
      <ExportPage
        title="Xuất D03"
        description="Kết xuất hồ sơ D03-TS để gửi cơ quan BHXH."
        endpoint={endpoints.declarations.d03Export}
        fileBaseName="D03"
      />
    ),
  },
  {
    path: 'declarations/ar/import',
    element: (
      <ImportPage
        title="Nhập AR"
        description="Nhập dữ liệu điều chỉnh (AR) từ tệp Excel."
        endpoint={endpoints.declarations.arImport}
      />
    ),
  },
  {
    path: 'declarations/ar/export',
    element: (
      <ExportPage
        title="Xuất AR"
        endpoint={endpoints.declarations.arExport}
        fileBaseName="AR"
      />
    ),
  },
  {
    path: 'declarations/d05/import',
    element: (
      <ImportPage
        title="Nhập D05"
        description="Nhập danh sách tham gia BHXH tự nguyện theo mẫu D05-TS."
        endpoint={endpoints.declarations.d05Import}
      />
    ),
  },
  {
    path: 'declarations/d05/export',
    element: (
      <ExportPage
        title="Xuất D05"
        endpoint={endpoints.declarations.d05Export}
        fileBaseName="D05"
      />
    ),
  },
];

/** Báo cáo theo loại hồ sơ. */
const REPORT_ROUTES = [
  { path: 'reports/d03', element: <ReportPage title="Báo cáo D03 - BHYT" type="d03" /> },
  { path: 'reports/ar', element: <ReportPage title="Báo cáo AR - BHYT" type="ar" /> },
  { path: 'reports/d05', element: <ReportPage title="Báo cáo D05 - BHXH" type="d05" /> },
  {
    path: 'reports/summary',
    element: (
      <ReportPage
        title="Báo cáo tổng hợp"
        description="Tổng hợp số thu theo đại lý trong kỳ."
        type="summary"
      />
    ),
  },
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
          { path: 'permissions', element: <PermissionsPage /> },
          { path: 'roles', element: <RolesPage /> },
          { path: 'agents', element: <AgentsPage /> },
          { path: 'insurance-history', element: <InsuranceHistoryPage /> },

          ...CATALOG_ROUTES,
          ...DECLARATION_ROUTES,
          ...REPORT_ROUTES,

          { path: 'settings', element: <SettingsPage title="Cài đặt" /> },
          { path: 'system-settings', element: <SettingsPage /> },
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
