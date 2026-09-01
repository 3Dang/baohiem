/**
 * Dữ liệu giả cho chế độ demo (VITE_DEMO_MODE=true) — chỉ dùng để xem thử
 * giao diện khi chưa có backend. Xoá cả thư mục `demo/` khi API thật sẵn sàng.
 */

/** Tài khoản cứng để đăng nhập ở chế độ demo. */
export const DEMO_ACCOUNT = {
  email: 'admin@baohiem.vn',
  password: 'admin123',
};

/** `permissions` rỗng nghĩa là không quyền nào — nên để tất cả quyền hay dùng. */
export const DEMO_USER = {
  id: 1,
  name: 'Quản trị viên',
  email: DEMO_ACCOUNT.email,
  permissions: [
    'base-salary.view',
    'insurance-receipt.view',
    'payment.view',
    'receipt.view',
    'permission.view',
    'e-receipt.view',
    'setting.view',
    'system-setting.view',
    'report.view',
    'agent.view',
    'log.view',
    'audit-log.view',
  ],
};

const PROVINCES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương', 'Nghệ An'];
const DISTRICTS = ['Quận 1', 'Quận Bình Thạnh', 'Huyện Hoài Đức', 'Quận Hải Châu', 'Huyện Bến Cát'];
const WARDS = ['Phường Bến Nghé', 'Phường 12', 'Xã An Khánh', 'Phường Thanh Bình'];
const HAMLETS = ['Ấp Tân Hoà', 'Thôn Đông', 'Khu phố 3', 'Ấp Bình Yên'];
const FACILITIES = ['BV Đa khoa tỉnh', 'TT Y tế Quận 1', 'BV Bạch Mai', 'BV Chợ Rẫy'];
const RELATIONS = ['Chủ hộ', 'Vợ/chồng', 'Con', 'Cha/mẹ', 'Anh/chị/em'];
const ETHNICITIES = ['Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa', 'Nùng', 'Dao', 'Chăm'];
const PEOPLE = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Cường',
  'Phạm Thị Dung',
  'Võ Minh Đức',
  'Đặng Thu Hà',
];
const AGENTS = ['Đại lý Bưu điện Q1', 'Đại lý Phú Nhuận', 'Đại lý Hoài Đức', 'Đại lý Hải Châu'];
const STATUSES = ['approved', 'pending', 'draft', 'rejected'];

/** Chọn phần tử theo chỉ số — cùng chỉ số luôn cho cùng kết quả. */
const pick = (list, index) => list[index % list.length];

/** Ngày ISO cách hôm nay `days` ngày. */
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

const serial = (prefix, index) => `${prefix}${String(index + 1).padStart(4, '0')}`;

/** Mức đóng BHYT hộ gia đình xoay quanh các mốc thực tế. */
const amountOf = (index) => (1 + (index % 6)) * 297_000;

/** Cứ 9 bản ghi có 1 bản đã ngừng dùng, để thấy cả hai trạng thái. */
const activeOf = (index) => index % 9 !== 8;

const insuranceNo = (index) => `01${String(23_456_789 + index * 137).padStart(8, '0')}`;

/**
 * Bộ sinh dữ liệu cho từng endpoint danh sách.
 * Khoá là path (đã bỏ baseURL), giá trị nhận chỉ số dòng 0-based.
 */
export const ROW_BUILDERS = {
  '/provinces': (i) => ({ code: serial('T', i), name: pick(PROVINCES, i), isActive: activeOf(i) }),
  '/districts': (i) => ({
    code: serial('H', i),
    name: pick(DISTRICTS, i),
    provinceName: pick(PROVINCES, i),
    isActive: activeOf(i),
  }),
  '/wards': (i) => ({
    code: serial('X', i),
    name: pick(WARDS, i),
    districtName: pick(DISTRICTS, i),
    provinceName: pick(PROVINCES, i),
    isActive: activeOf(i),
  }),
  '/hamlets': (i) => ({
    code: serial('A', i),
    name: pick(HAMLETS, i),
    wardName: pick(WARDS, i),
    isActive: activeOf(i),
  }),
  '/medical-facilities': (i) => ({
    code: serial('KCB', i),
    name: pick(FACILITIES, i),
    provinceName: pick(PROVINCES, i),
    level: pick(['Trung ương', 'Tỉnh', 'Huyện', 'Xã'], i),
    isActive: activeOf(i),
  }),
  '/relationships': (i) => ({
    code: serial('QH', i),
    name: pick(RELATIONS, i),
    isActive: activeOf(i),
  }),
  '/contribution-levels': (i) => ({
    code: serial('MD', i),
    name: `Mức ${(i % 6) + 1} — ${(i % 6) * 3 + 3} tháng`,
    amount: amountOf(i),
    months: (i % 6) * 3 + 3,
    isActive: activeOf(i),
  }),
  '/ethnicities': (i) => ({
    code: serial('DT', i),
    name: pick(ETHNICITIES, i),
    isActive: activeOf(i),
  }),

  '/base-salaries': (i) => ({
    amount: 1_490_000 + i * 300_000,
    effectiveFrom: daysAgo(900 - i * 200),
    effectiveTo: i === 0 ? null : daysAgo(900 - (i + 1) * 200),
    note: i === 0 ? 'Đang áp dụng' : 'Đã hết hiệu lực',
  }),
  '/insurance-receipts': (i) => ({
    receiptNo: serial('BL', i),
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    amount: amountOf(i),
    issuedAt: daysAgo(i),
    status: pick(STATUSES, i),
    lookupCode: `TC${serial('', i)}`,
    sentAt: daysAgo(i),
  }),
  '/payments': (i) => ({
    code: serial('PN', i),
    agentName: pick(AGENTS, i),
    amount: amountOf(i) * 12,
    paidAt: daysAgo(i * 2),
    status: pick(STATUSES, i),
  }),
  '/receipts': (i) => ({
    receiptNo: serial('BL', i),
    bookNo: serial('S', i % 12),
    fullName: pick(PEOPLE, i),
    amount: amountOf(i),
    issuedAt: daysAgo(i),
    collectorName: pick(PEOPLE, i + 2),
  }),
  '/agents': (i) => ({
    code: serial('DL', i),
    name: pick(AGENTS, i),
    provinceName: pick(PROVINCES, i),
    phone: `090${String(1_234_567 + i * 11).slice(0, 7)}`,
    isActive: activeOf(i),
  }),
  '/insurance-history': (i) => ({
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    fromDate: daysAgo(400 - i * 30),
    toDate: daysAgo(400 - (i + 1) * 30),
    facilityName: pick(FACILITIES, i),
    amount: amountOf(i),
  }),
  '/permissions': (i) => {
    const groups = ['Biên lai', 'Nộp tiền', 'Danh mục', 'Báo cáo', 'Hệ thống'];
    const actions = ['view', 'create', 'update', 'delete'];
    return {
      name: `${pick(['receipt', 'payment', 'catalog', 'report', 'system'], i)}.${pick(actions, i)}`,
      group: pick(groups, i),
      description: `Quyền ${pick(actions, i)} trong nhóm ${pick(groups, i).toLowerCase()}`,
    };
  },
  '/roles': (i) => ({
    name: pick(['Super admin', 'Quản trị viên', 'Nhân viên đại lý', 'Kế toán', 'Chỉ xem'], i),
    permissionsCount: 48 - i * 7,
    usersCount: 12 - i,
    createdAt: daysAgo(300 - i * 20),
  }),
  '/system-logs': (i) => ({
    level: pick(['info', 'warning', 'error', 'debug'], i),
    message: pick(
      [
        'Đồng bộ danh mục tỉnh/thành thành công',
        'Job gửi biên lai điện tử thất bại, sẽ thử lại',
        'Không kết nối được cổng BHXH',
        'Xoá cache cấu hình',
      ],
      i,
    ),
    context: pick(['SyncCatalog', 'SendReceiptJob', 'BhxhGateway', 'Cache'], i),
    createdAt: daysAgo(i / 4),
  }),
  '/audit-logs': (i) => ({
    actor: pick(PEOPLE, i),
    action: pick(['Tạo', 'Cập nhật', 'Xoá', 'Xuất tệp'], i),
    subject: `${pick(['Biên lai', 'Phiếu nộp', 'Đại lý', 'Cài đặt'], i)} #${100 + i}`,
    ip: `192.168.1.${10 + (i % 200)}`,
    createdAt: daysAgo(i / 3),
  }),
};

/** Tổng số bản ghi giả cho từng endpoint, khớp badge trên sidebar. */
export const TOTALS = {
  '/provinces': 34,
  '/districts': 143,
  '/wards': 87,
  '/hamlets': 9422,
  '/medical-facilities': 62,
  '/relationships': 23,
  '/contribution-levels': 5,
  '/ethnicities': 9,
  '/base-salaries': 4,
  '/insurance-receipts': 214,
  '/payments': 76,
  '/receipts': 318,
  '/agents': 28,
  '/insurance-history': 45,
  '/permissions': 48,
  '/roles': 6,
  '/system-logs': 132,
  '/audit-logs': 260,
};

/** Số liệu cho bảng điều khiển và badge cạnh menu. */
export const SUMMARY = {
  stats: {
    receiptsThisMonth: 318,
    revenueThisMonth: 1_284_600_000,
    activePolicies: 4_512,
    pendingDeclarations: 27,
  },
  recentActivities: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    action: pick(
      [
        'Phát hành biên lai BL0318 cho Nguyễn Văn An',
        'Nhập 142 dòng hồ sơ D03 từ tệp Excel',
        'Duyệt phiếu nộp tiền PN0076',
        'Cập nhật danh mục mức đóng',
        'Kết xuất báo cáo D05 tháng này',
        'Thêm đại lý thu Hải Châu',
      ],
      i,
    ),
    actor: pick(PEOPLE, i),
    createdAt: daysAgo(i / 2),
  })),
  badges: {
    provinces: 34,
    districts: 143,
    wards: 87,
    hamlets: 9422,
    medicalFacilities: 62,
    relationships: 23,
    contributionLevels: 5,
    ethnicities: 9,
    roles: 6,
    systemSettings: 14,
  },
  unreadNotifications: 3,
};

/** Thông báo hệ thống; 3 mục đầu chưa đọc để khớp `unreadNotifications`. */
export const NOTIFICATIONS = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  title: pick(
    [
      'Hồ sơ D03 đã được cơ quan BHXH tiếp nhận',
      'Phiếu nộp tiền PN0076 chờ duyệt',
      'Kết xuất D05 hoàn tất',
      'Cảnh báo: 27 hồ sơ chưa gửi',
    ],
    i,
  ),
  body: 'Bấm vào mục tương ứng trên thanh bên để xem chi tiết.',
  readAt: i < 3 ? null : daysAgo(i),
  createdAt: daysAgo(i / 2),
}));

/** Cấu hình hệ thống — backend thật cũng trả về đúng khuôn này. */
export const SETTINGS = {
  groups: [
    {
      key: 'organization',
      label: 'Thông tin đơn vị',
      fields: [
        { key: 'org_name', label: 'Tên đơn vị', value: 'Bảo hiểm xã hội tỉnh' },
        { key: 'org_code', label: 'Mã đơn vị', value: 'BHXH-001' },
        { key: 'org_phone', label: 'Điện thoại', value: '02838221234' },
        { key: 'org_email', label: 'E-mail', value: 'lienhe@bhxh.gov.vn', type: 'email' },
      ],
    },
    {
      key: 'receipt',
      label: 'Biên lai',
      fields: [
        { key: 'receipt_prefix', label: 'Tiền tố số biên lai', value: 'BL' },
        {
          key: 'receipt_next_no',
          label: 'Số tiếp theo',
          value: '319',
          type: 'number',
          hint: 'Hệ thống tự tăng sau mỗi lần phát hành.',
        },
      ],
    },
    {
      key: 'gateway',
      label: 'Kết nối cơ quan BHXH',
      fields: [
        { key: 'gateway_url', label: 'Địa chỉ cổng tiếp nhận', value: 'https://gdbhxh.gov.vn' },
        { key: 'gateway_account', label: 'Tài khoản kết nối', value: 'bhxh001' },
      ],
    },
  ],
};

/** Kết quả báo cáo theo từng loại hồ sơ. */
export const REPORT_ROWS = {
  d03: (i) => ({
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    wardName: pick(WARDS, i),
    months: (i % 4) * 3 + 3,
    amount: amountOf(i),
    submittedAt: daysAgo(i),
  }),
  ar: (i) => ({
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    changeType: pick(['Tăng mới', 'Giảm', 'Điều chỉnh mức đóng', 'Đổi nơi KCB'], i),
    amount: amountOf(i),
    submittedAt: daysAgo(i),
  }),
  d05: (i) => ({
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    salaryBase: 1_500_000 + (i % 5) * 500_000,
    months: (i % 4) * 3 + 3,
    amount: amountOf(i) * 2,
    submittedAt: daysAgo(i),
  }),
  summary: (i) => ({
    agentName: pick(AGENTS, i),
    participants: 420 - i * 37,
    receipts: 318 - i * 29,
    amount: (420 - i * 37) * 297_000,
  }),
};

/** Kết quả tìm kiếm toàn hệ thống. */
export const SEARCH_GROUPS = (term) => [
  {
    label: 'Biên lai',
    items: Array.from({ length: 3 }, (_, i) => ({
      id: `receipt-${i}`,
      title: `Biên lai ${serial('BL', i)} — ${pick(PEOPLE, i)}`,
      subtitle: `Khớp với “${term}” · ${insuranceNo(i)}`,
      url: '/receipts',
    })),
  },
  {
    label: 'Đại lý',
    items: Array.from({ length: 2 }, (_, i) => ({
      id: `agent-${i}`,
      title: pick(AGENTS, i),
      subtitle: `Khớp với “${term}” · ${pick(PROVINCES, i)}`,
      url: '/agents',
    })),
  },
];

