/**
 * Bảng tra đường dẫn API. Mọi module chỉ tham chiếu qua đây để khi backend
 * đổi path thì chỉ sửa một chỗ duy nhất.
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  dashboard: {
    summary: '/dashboard/summary',
  },
  notifications: {
    list: '/notifications',
    markAllRead: '/notifications/read-all',
  },
  // Các nhóm nghiệp vụ: mỗi resource theo chuẩn REST
  // GET list · GET :id · POST · PUT :id · DELETE :id
  resources: {
    baseSalary: '/base-salaries',
    insuranceReceipts: '/insurance-receipts',
    payments: '/payments',
    receipts: '/receipts',
    permissions: '/permissions',
    roles: '/roles',
    settings: '/settings',
    provinces: '/provinces',
    districts: '/districts',
    wards: '/wards',
    hamlets: '/hamlets',
    medicalFacilities: '/medical-facilities',
    relationships: '/relationships',
    contributionLevels: '/contribution-levels',
    ethnicities: '/ethnicities',
    agents: '/agents',
    insuranceHistory: '/insurance-history',
    auditLogs: '/audit-logs',
    systemLogs: '/system-logs',
  },
  // Nhóm khai báo hồ sơ D03/D05/AR: nhập (import) và xuất (export) tách riêng
  declarations: {
    d03Import: '/declarations/d03/import',
    d03Export: '/declarations/d03/export',
    arImport: '/declarations/ar/import',
    arExport: '/declarations/ar/export',
    d05Import: '/declarations/d05/import',
    d05Export: '/declarations/d05/export',
  },
  reports: {
    d03: '/reports/d03',
    ar: '/reports/ar',
    d05: '/reports/d05',
    summary: '/reports/summary',
  },
};
