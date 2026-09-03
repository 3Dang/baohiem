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
  // Kèm ba đường dẫn phụ suy ra từ đường dẫn danh sách, dùng chung cho mọi
  // resource: `/counts` (đếm theo điều kiện), `/ids` (lấy id để chọn tất cả),
  // `/export` (kết xuất cả tập kết quả ra tệp)
  resources: {
    baseSalary: '/base-salaries',
    insuranceReceipts: '/insurance-receipts',
    payments: '/payments',
    receipts: '/receipts',
    permissions: '/permissions',
    roles: '/roles',
    // Quyển biên lai cấp cho đại lý thu (khác `permissions` — quyền hệ thống)
    receiptBooks: '/receipt-books',
    // Cấu hình dạng khoá/giá trị, mỗi dòng một bản ghi
    settings: '/settings',
    // Tham số hệ thống, cũng là danh sách nhưng chia theo danh mục và có kiểu dữ liệu
    systemSettings: '/system-settings',
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
  /**
   * Biên bản trả quyển — mẫu văn bản có ký nhận khi đại lý nộp lại quyển biên
   * lai, khác bản kê dữ liệu (`/receipt-books/export`) nên là đường dẫn riêng.
   * Tham số `returnStatus` chọn lập biên bản cho quyển đã trả hay còn đang nợ.
   */
  receiptBooks: {
    returnReport: '/receipt-books/return-report',
  },
  /**
   * Nhận một dải số biên lai từ cổng BHXH. Không phải REST trên `/receipts` vì
   * một lần gọi tạo cả dải (51-100) chứ không phải một bản ghi, và dải đó do cơ
   * quan BHXH cấp — hệ thống chỉ ghi nhận, không tự đặt số.
   */
  receipts: {
    importFromBhxh: '/receipts/import-bhxh',
  },
  /**
   * Hai việc theo lô của trang Lịch sử bảo hiểm. Tách khỏi `resources` vì không
   * phải REST: `import` nhận tệp Excel (multipart), `template` trả về tệp mẫu.
   */
  insuranceHistory: {
    import: '/insurance-history/import',
    template: '/insurance-history/template',
  },
  // Nhóm khai báo hồ sơ D03/D05/AR: nhập (import) và xuất (export) tách riêng
  declarations: {
    // Danh sách hồ sơ đã nhập / chờ kết xuất của từng mẫu biểu
    d03: '/declarations/d03',
    ar: '/declarations/ar',
    d05: '/declarations/d05',
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
    /*
     * Báo cáo tổng hợp có hai bảng trong một response nên tệp kết xuất phải nói
     * rõ xuất bảng nào: `?sheet=d03` hoặc `?sheet=d05`. Không có tham số này thì
     * hai nút xuất trên trang gọi cùng một thứ và trả về cùng một tệp.
     */
    summaryExport: '/reports/summary/export',
    /*
     * Kết xuất tách khỏi đường dẫn danh sách vì hai thứ trả về khác nhau:
     * `/reports/d03` trả JSON phân trang, `/reports/d03/export` trả tệp. Trang
     * nào cần tệp báo cáo (kể cả trang biên lai) phải gọi qua đây, gọi thẳng
     * đường dẫn danh sách sẽ tải về một tệp JSON.
     */
    export: (type) => `/reports/${type}/export`,
    statistics: (type) => `/reports/${type}/statistics`,
  },
  /**
   * Hai truy vấn phụ của trang báo cáo, tách khỏi danh sách vì nói về cả kỳ:
   * - `stats`: số hồ sơ chưa duyệt/đã duyệt của hôm nay, hôm qua và toàn bộ kỳ
   * - `dateMismatch`: hồ sơ có ngày trên tệp nhập lệch với ngày biên lai
   */
  reportExtras: (type) => ({
    stats: `/reports/${type}/stats`,
    dateMismatch: `/reports/${type}/date-mismatch`,
  }),
};
