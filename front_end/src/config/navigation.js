/**
 * Cấu trúc menu bên trái. Mỗi nhóm là một section có thể thu gọn.
 *
 * - `to`: đường dẫn router
 * - `icon`: tên icon trong components/ui/Icon
 * - `permission`: slug quyền; thiếu quyền thì mục bị ẩn (khớp user.permissions)
 * - `countKey`: khoá trong response GET /dashboard/summary → badges,
 *   dùng để hiện số bản ghi cạnh mục menu (ví dụ 34 tỉnh, 143 quận/huyện)
 */
export const navigation = [
  {
    id: 'main',
    items: [
      { to: '/', label: 'Bảng điều khiển', icon: 'dashboard' },
      { to: '/base-salary', label: 'Base salary', icon: 'coin', permission: 'base-salary.view' },
      {
        to: '/insurance-receipts',
        label: 'Biên lai bảo hiểm',
        icon: 'receipt',
        permission: 'insurance-receipt.view',
      },
    ],
  },
  {
    id: 'receipt-management',
    label: 'Quản lý biên',
    items: [
      { to: '/payments', label: 'Quản lý nộp tiền', icon: 'wallet', permission: 'payment.view' },
      { to: '/receipts', label: 'Biên lai', icon: 'receipt', permission: 'receipt.view' },
      { to: '/permissions', label: 'Quản lý quyền', icon: 'users', permission: 'permission.view' },
    ],
  },
  {
    id: 'catalog',
    label: 'Danh mục',
    items: [
      { to: '/settings', label: 'Cài đặt', icon: 'cog', permission: 'setting.view' },
      {
        to: '/catalog/provinces',
        label: 'Danh mục tỉnh/thành',
        icon: 'building',
        countKey: 'provinces',
      },
      {
        to: '/catalog/districts',
        label: 'Danh mục quận/huyện',
        icon: 'building',
        countKey: 'districts',
      },
      { to: '/catalog/wards', label: 'Danh mục phường/xã', icon: 'home', countKey: 'wards' },
      { to: '/catalog/hamlets', label: 'Danh mục thôn/ấp', icon: 'map', countKey: 'hamlets' },
      {
        to: '/catalog/medical-facilities',
        label: 'Danh mục nơi khám chữa bệnh',
        icon: 'hospital',
        countKey: 'medicalFacilities',
      },
      {
        to: '/catalog/relationships',
        label: 'Danh mục quan hệ',
        icon: 'heart',
        countKey: 'relationships',
      },
      {
        to: '/catalog/contribution-levels',
        label: 'Danh mục mức đóng',
        icon: 'coin',
        countKey: 'contributionLevels',
      },
      {
        to: '/catalog/ethnicities',
        label: 'Danh mục dân tộc',
        icon: 'flag',
        countKey: 'ethnicities',
      },
    ],
  },
  {
    id: 'e-receipt',
    label: 'Quản lý biên lai điện tử',
    items: [
      {
        to: '/e-receipts',
        label: 'Biên lai',
        icon: 'receipt',
        permission: 'e-receipt.view',
      },
    ],
  },
  {
    id: 'shield',
    label: 'Phân quyền',
    items: [{ to: '/roles', label: 'Vai trò', icon: 'shield', countKey: 'roles' }],
  },
  {
    id: 'system-tools',
    label: 'Công cụ hệ thống',
    items: [{ to: '/system-logs', label: 'System logs', icon: 'bug', permission: 'log.view' }],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      {
        to: '/reports/summary',
        label: 'Báo cáo tổng hợp',
        icon: 'chart',
        permission: 'report.view',
      },
    ],
  },
  {
    id: 'd03',
    label: 'D03',
    items: [
      { to: '/declarations/d03/import', label: 'Nhập D03', icon: 'inbox' },
      { to: '/declarations/d03/export', label: 'Xuất D03', icon: 'upload' },
      { to: '/declarations/ar/import', label: 'Nhập AR', icon: 'tag' },
      { to: '/declarations/ar/export', label: 'Xuất AR', icon: 'tag' },
    ],
  },
  {
    id: 'd05',
    label: 'D05',
    items: [
      { to: '/declarations/d05/import', label: 'Nhập D05', icon: 'camera' },
      { to: '/declarations/d05/export', label: 'Xuất D05', icon: 'send' },
    ],
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    items: [
      { to: '/reports/d03', label: 'Báo cáo D03 - BHYT', icon: 'document' },
      { to: '/reports/ar', label: 'Báo cáo AR - BHYT', icon: 'document' },
      { to: '/reports/d05', label: 'Báo cáo D05 - BHXH', icon: 'document' },
    ],
  },
  {
    id: 'system-admin',
    label: 'Quản trị hệ thống',
    items: [
      {
        to: '/system-settings',
        label: 'Cài đặt hệ thống',
        icon: 'cog',
        countKey: 'systemSettings',
        permission: 'system-setting.view',
      },
    ],
  },
  {
    id: 'agents',
    label: 'Đại lý & người dùng',
    items: [{ to: '/agents', label: 'Quản lý đại lý', icon: 'users', permission: 'agent.view' }],
  },
  {
    id: 'lookup',
    label: 'Tra cứu & báo cáo',
    items: [{ to: '/insurance-history', label: 'Lịch sử bảo hiểm', icon: 'clock' }],
  },
  {
    id: 'system',
    label: 'Hệ thống',
    items: [
      { to: '/audit-logs', label: 'Audit logs', icon: 'clipboard', permission: 'audit-log.view' },
    ],
  },
];
