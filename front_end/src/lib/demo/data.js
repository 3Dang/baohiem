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
    'receipt-book.view',
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

const PROVINCES = [
  'Thành phố Hà Nội',
  'TP. Hồ Chí Minh',
  'Thành phố Đà Nẵng',
  'Thành phố Cần Thơ',
  'Tỉnh Bình Dương',
  'Tỉnh Nghệ An',
];
const DISTRICTS = [
  'Huyện An Biên',
  'Huyện An Minh',
  'Huyện An Phú',
  'Huyện Ba Tri',
  'Huyện Bình Chánh',
];
const WARDS = ['Phường Ba Đình', 'Phường Ngọc Hà', 'Xã An Khánh', 'Phường Thới Bình'];
const HAMLETS = ['Ấp 5', 'Lộc Ân', 'Khu phố 7', 'Sơn Long', 'Phụng Thạnh 1'];
const FACILITIES = [
  'Ban Bảo vệ CSSK cán bộ',
  'Bệnh viện 175',
  'Bệnh viện 30 tháng 4',
  'Trung tâm Y tế Thoại Sơn',
];
const RELATIONS = ['Chủ hộ', 'Vợ', 'Chồng', 'Bố', 'Mẹ', 'Em', 'Con'];
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
/** Xã trước sáp nhập — hệ thống giữ cả tên cũ để tra cứu hồ sơ đã nộp. */
const OLD_WARDS = ['Xã Vĩnh Hoà', 'Xã Đông Thái', 'Phường 12', 'Xã Tân Thạnh'];
const REASONS = [
  'Gia hạn thẻ theo biên lai mới',
  'Đồng bộ từ cổng BHXH',
  'Nhập từ tệp Excel của đại lý',
  'Điều chỉnh sai hạn thẻ',
  'Tham gia mới BHXH tự nguyện',
];
const STATUSES = ['approved', 'pending', 'draft', 'rejected'];
const RECEIPT_TYPES = ['bhyt', 'bhxh', 'combined'];
const INSURANCE_TYPES = ['d03', 'd05'];
const CONFIRM_STATUSES = ['confirmed', 'waiting', 'rejected'];
/** Bảng dữ liệu bị ghi vết trong audit log. */
const AUDIT_TABLES = [
  'insurance_receipts',
  'declarations',
  'payments',
  'agents',
  'receipt_books',
  'settings',
];

/** Chọn phần tử theo chỉ số — cùng chỉ số luôn cho cùng kết quả. */
const pick = (list, index) => list[index % list.length];

/** Ngày ISO cách hôm nay `days` ngày. */
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Mốc thời gian nghiệp vụ (ngày thu, ngày nộp, ngày kê khai…).
 *
 * Bộ lọc mặc định của các trang nghiệp vụ là "từ đầu tháng đến hôm nay", nên
 * phần lớn dòng phải nằm trong khoảng đó — nếu không thì vừa mở trang đã thấy
 * bảng trống và không đánh giá được gì. Cứ 5 dòng chừa 1 dòng ở tháng trước để
 * thấy bộ lọc có tác dụng thật.
 */
const businessDate = (index) => {
  const now = new Date();
  const today = now.getDate();

  // Dòng ngoài kỳ: lùi hẳn về trước ngày 1 của tháng này
  if (index % 5 === 4) return daysAgo(today + 3 + (index % 25));

  const day = 1 + (index % today);
  return new Date(now.getFullYear(), now.getMonth(), day, 8 + (index % 9), (index * 7) % 60).toISOString();
};

const serial = (prefix, index) => `${prefix}${String(index + 1).padStart(4, '0')}`;

/** Mức đóng BHYT hộ gia đình xoay quanh các mốc thực tế. */
const amountOf = (index) => (1 + (index % 6)) * 297_000;

/** Cứ 9 bản ghi có 1 bản đã ngừng dùng, để thấy cả hai trạng thái. */
const activeOf = (index) => index % 9 !== 8;

const insuranceNo = (index) => `01${String(23_456_789 + index * 137).padStart(8, '0')}`;

/**
 * Số CCCD 12 chữ số, sinh từ chỉ số nên tra cứu theo CCCD luôn ra đúng một
 * người. Đúng 12 chữ số vì ô tra cứu ở Bảng điều khiển chỉ nhận 9 hoặc 12 —
 * số 11 chữ số bị chặn ngay tại form, chưa kịp gọi API.
 */
const idNoOf = (index) => String(792_081_012_936 + index * 7919);

const genderOf = (index) => (index % 2 === 0 ? 'Nữ' : 'Nam');

/** Hình thức nộp: ON = chuyển khoản/online, TM = tiền mặt. */
const payMethodOf = (index) => (index % 3 === 0 ? 'online' : 'cash');

/** Giải pháp đóng — kỳ đóng ghi trên biên lai, khớp bộ lọc của trang xuất/báo cáo. */
const solutionOf = (index) => pick(['monthly', 'quarterly', 'yearly'], index);

/** Số tháng của một kỳ đóng; hai trường này phải khớp nhau trên cùng một dòng. */
const MONTHS_PER_SOLUTION = { monthly: 1, quarterly: 3, yearly: 12 };

/**
 * Lịch sử bảo hiểm chia theo hai chiều, mỗi chiều phủ kín cả tập:
 * loại bảo hiểm (BHYT/BHXH) và nguồn dữ liệu (nhập Excel / hệ thống sinh).
 * Đặt ngưỡng bằng hằng số để con số trên tab khớp với dữ liệu thật sự lọc ra.
 */
const D05_HISTORY_ROWS = 2;
const IMPORTED_HISTORY_ROWS = 38_410;

/**
 * Bộ sinh dữ liệu cho từng endpoint danh sách.
 * Khoá là path (đã bỏ baseURL), giá trị nhận chỉ số dòng 0-based.
 */
export const ROW_BUILDERS = {
  '/provinces': (i) => ({
    code: String(i + 1).padStart(2, '0'),
    name: pick(PROVINCES, i),
    isActive: activeOf(i),
    createdAt: daysAgo(700 - i),
  }),
  '/districts': (i) => ({
    code: String(785 + i),
    name: pick(DISTRICTS, i),
    provinceName: pick(PROVINCES, i),
    wardsCount: 9 + (i % 15),
    isActive: activeOf(i),
    createdAt: daysAgo(600 - i),
  }),
  '/wards': (i) => ({
    code: String(i + 1).padStart(5, '0'),
    name: pick(WARDS, i),
    fullName: `${pick(WARDS, i)}, ${pick(PROVINCES, i)}`,
    districtName: pick(DISTRICTS, i),
    provinceName: pick(PROVINCES, i),
    // Xã sau sáp nhập gộp nhiều mã cũ, nên đây là danh sách ghép bằng dấu ";"
    oldCodes: Array.from({ length: 3 + (i % 3) }, (_, k) =>
      String(13 + i * 7 + k * 5).padStart(5, '0'),
    ).join(';'),
    provinceCode: String((i % 34) + 1).padStart(2, '0'),
    hamletsCount: i % 4,
    isActive: activeOf(i),
    createdAt: daysAgo(500 - i),
  }),
  '/hamlets': (i) => ({
    code: String(i + 1).padStart(3, '0'),
    name: pick(HAMLETS, i),
    wardName: pick(WARDS, i),
    isActive: activeOf(i),
    createdAt: daysAgo(400 - i / 10),
  }),
  '/medical-facilities': (i) => ({
    code: String(i + 1).padStart(3, '0'),
    name: pick(FACILITIES, i),
    provinceName: pick(PROVINCES, i),
    // Tỉnh/thành sau sáp nhập — hệ thống giữ cả hai để tra cứu hồ sơ cũ
    newProvinceName: pick(PROVINCES, i + 3),
    level: pick(['Trung ương', 'Tỉnh', 'Huyện', 'Xã'], i),
    isActive: activeOf(i),
    createdAt: daysAgo(800 - i / 5),
  }),
  '/relationships': (i) => ({
    code: String(i).padStart(2, '0'),
    name: pick(RELATIONS, i),
    isActive: activeOf(i),
    createdAt: daysAgo(900 - i),
  }),
  '/contribution-levels': (i) => ({
    code: pick(['40', '50', '60', '70', '4.5'], i),
    rate: pick([40, 50, 60, 70, 100], i),
    name: `Người thứ ${pick(['năm', 'tư', 'ba', 'hai', 'nhất'], i)}: ${pick([40, 50, 60, 70, 100], i)}%`,
    amount: amountOf(i),
    months: (i % 6) * 3 + 3,
    isActive: activeOf(i),
    createdAt: daysAgo(900 - i),
  }),
  '/ethnicities': (i) => ({
    code: String(i + 1),
    name: pick(ETHNICITIES, i),
    isActive: activeOf(i),
    createdAt: daysAgo(900 - i),
  }),

  '/base-salaries': (i) => ({
    amount: 1_490_000 + i * 300_000,
    effectiveFrom: daysAgo(900 - i * 200),
    effectiveTo: i === 0 ? null : daysAgo(900 - (i + 1) * 200),
    note: i === 0 ? 'Đang áp dụng' : 'Đã hết hiệu lực',
    // Chỉ mốc mới nhất đang bật, giống hệ thống thật
    isActive: i === 0,
  }),
  /**
   * Biên lai đã phát hành. `type` phân biệt biên lai điện tử với biên lai giấy —
   * trang Biên lai điện tử là chính danh sách này lọc theo `type=electronic`,
   * nên biên lai giấy phải thật sự có mặt, nếu không hai trang giống hệt nhau.
   */
  '/insurance-receipts': (i) => {
    const electronic = i % 3 !== 2;

    return {
      receiptNo: serial('BL', i),
      insuranceNo: insuranceNo(i),
      fullName: pick(PEOPLE, i),
      amount: amountOf(i),
      issuedAt: businessDate(i),
      status: pick(STATUSES, i),
      type: electronic ? 'electronic' : 'paper',
      // Mã tra cứu và thời điểm gửi chỉ có ở biên lai điện tử
      lookupCode: electronic ? `TC${serial('', i)}` : null,
      sentAt: electronic ? businessDate(i) : null,
      receiptType: pick(RECEIPT_TYPES, i),
      agentName: pick(AGENTS, i),
    };
  },
  '/payments': (i) => ({
    code: serial('PN', i),
    agentName: pick(AGENTS, i),
    districtName: pick(DISTRICTS, i),
    amount: amountOf(i) * 12,
    paidAt: businessDate(i),
    status: pick(STATUSES, i),
    insuranceType: pick(INSURANCE_TYPES, i),
    attachmentStatus: i % 3 === 0 ? 'missing' : 'attached',
    confirmStatus: pick(CONFIRM_STATUSES, i),
  }),
  '/receipts': (i) => ({
    receiptNo: serial('BL', i),
    bookNo: serial('S', i % 12),
    fullName: pick(PEOPLE, i),
    amount: amountOf(i),
    issuedAt: businessDate(i),
    collectorName: pick(PEOPLE, i + 2),
    status: pick(STATUSES, i),
    agentName: pick(AGENTS, i),
    districtName: pick(DISTRICTS, i),
    receiptType: pick(RECEIPT_TYPES, i),
    // Tháng cấp lại dạng yyyy-MM để khớp bộ lọc theo tháng. Rải trên 12 tháng
    // gần nhất — mỗi tháng một khoá thì lọc theo tháng nào cũng chỉ ra một dòng
    reissueMonth: daysAgo((i % 12) * 30).slice(0, 7),
  }),
  /**
   * Đại lý thu. Ngoài mã/tên còn có hai mã do cơ quan BHXH cấp riêng cho từng
   * nghiệp vụ (BHYT và BHXH) và danh sách xã quản lý — sau sáp nhập thì tên xã
   * đổi, nên giữ cả tên cũ để đối chiếu hồ sơ đã nộp.
   */
  '/agents': (i) => ({
    code: serial('DL', i),
    name: pick(AGENTS, i),
    // Tên đầy đủ trên quyết định uỷ quyền, khác tên gọi tắt trong hệ thống
    officialName: `${pick(AGENTS, i)} - ${pick(DISTRICTS, i)}`,
    email: `daily${String(i + 1).padStart(3, '0')}@happylee.vn`,
    provinceName: pick(PROVINCES, i),
    districtName: pick(DISTRICTS, i),
    phone: `090${String(1_234_567 + i * 11).slice(0, 7)}`,
    bhytCode: `YT${String(10_450 + i * 17)}`,
    bhxhCode: `XH${String(20_310 + i * 23)}`,
    wardName: pick(WARDS, i),
    oldWardName: pick(OLD_WARDS, i),
    // Đại lý được phép phát hành biên lai điện tử hay chỉ biên lai giấy
    eReceiptEnabled: i % 4 !== 3,
    isActive: activeOf(i),
  }),
  /**
   * Lịch sử thay đổi hạn thẻ: mỗi dòng là một lần gia hạn của một người.
   *
   * `fromDate`/`toDate` chính là hạn cũ và hạn mới — gia hạn nối tiếp từ ngày
   * thẻ cũ hết hiệu lực, nên không tách thành hai cặp trường khác nhau.
   *
   * `source` cho biết dòng đến từ đâu, `insuranceType` là loại bảo hiểm; đó là
   * hai cách chia của cùng một tập, đúng như dải tab của trang.
   */
  '/insurance-history': (i) => {
    // 24 kỳ gia hạn gần nhất; hạn mới luôn dài hơn hạn cũ 12 tháng
    const term = (i % 24) * 15;

    return {
      insuranceNo: insuranceNo(i),
      fullName: pick(PEOPLE, i),
      idNo: idNoOf(i),
      insuranceType: i < D05_HISTORY_ROWS ? 'd05' : 'd03',
      source: i < IMPORTED_HISTORY_ROWS ? 'import' : 'system',
      fromDate: daysAgo(360 - term),
      toDate: daysAgo(-5 - term),
      reason: pick(REASONS, i),
      facilityName: pick(FACILITIES, i),
      amount: amountOf(i),
      // Rải trên hơn hai năm để tab "7 ngày gần đây" lọc ra một phần nhỏ (~1.300 dòng)
      createdAt: daysAgo((i % 3_506) / 4),
    };
  },
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
    name: pick(
      ['Super Admin', 'Daily', 'Kiemtrabienlai', 'Dailytrabien', 'Panel User', 'Bảo Hiểm Xã Hội'],
      i,
    ),
    guardName: 'web',
    permissionsCount: [356, 26, 15, 36, 0, 2][i % 6],
    usersCount: 12 - i,
    createdAt: daysAgo(300 - i * 20),
    updatedAt: daysAgo(300 - i * 20),
  }),

  /** Cấu hình dạng khoá/giá trị — mỗi dòng là một tham số tính toán. */
  '/settings': (i) => {
    const rows = [
      ['government_support_rate', '10', 'Tỉ lệ nhà nước hỗ trợ 10% dùng cho D05'],
      ['interest_rate', '32.2', 'Tỉ lệ lãi suất'],
      ['base_salary', '1500000', 'Mức lương tối thiểu (1,500,000)'],
      ['insurance_rate', '22', '22%'],
      ['medical_insurance_rate', '0.045', 'Công thức tính toán số tiền tăng'],
      ['base_salary_medical', '2340000', 'Lương cơ bản BHYT - Tính từ 01/07/2025'],
    ];
    const [key, value, description] = rows[i % rows.length];
    return { key, value, description, createdAt: daysAgo(200 - i) };
  },

  /** Quyển biên lai giao cho đại lý: theo dõi đã trả biên hay chưa. */
  '/receipt-books': (i) => ({
    code: serial('Q', i),
    fromNo: serial('BL', i * 50),
    toNo: serial('BL', i * 50 + 49),
    agentName: pick(AGENTS, i),
    districtName: pick(DISTRICTS, i),
    issuedAt: businessDate(i),
    returnedAt: i % 3 === 0 ? null : businessDate(i + 1),
    // Khớp tab All / Chưa trả / Đã trả trên trang Quản lý quyển
    returnStatus: i % 3 === 0 ? 'pending' : 'returned',
  }),
  /**
   * Hồ sơ D03 (BHYT hộ gia đình). Cứ 3 người thuộc một mã hộ để trang Xuất D03
   * có nhóm mà gom, đúng cách hệ thống cũ trình bày theo hộ gia đình.
   */
  '/declarations/d03': (i) => ({
    householdNo: `92${String(22771905 + Math.floor(i / 3) * 1370).slice(0, 8)}`,
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    idNo: idNoOf(i),
    birthDate: daysAgo(9000 + i * 130),
    gender: genderOf(i),
    receiptNo: `${serial('BL', i)}/025`,
    rate: pick([100, 70, 60, 50], i),
    validFrom: daysAgo(-30 - (i % 60)),
    amount: pick([2_530_000, 1_771_000, 2_530_000, 1_518_000], i),
    address: `${pick(HAMLETS, i)}, ${pick(WARDS, i)}`,
    facilityName: pick(FACILITIES, i),
    subsidy: Math.round(amountOf(i) * 0.115),
    status: pick(['pending', 'approved', 'draft'], i),
    householdStatus: i % 5 === 2 ? 'suspect' : 'valid',
    wardName: pick(WARDS, i),
    agentName: pick(AGENTS, i),
    submittedAt: businessDate(i),
    // Ngày ghi trên biên lai và ngày cơ quan BHXH duyệt: hồ sơ chưa duyệt để trống
    receiptDate: businessDate(i),
    approvedAt: i % 3 === 1 ? null : businessDate(i + 2),
    solution: solutionOf(i),
    /*
     * Ngày đưa hồ sơ vào bản kê gửi cơ quan BHXH — mốc thứ ba của cùng một hồ
     * sơ, cạnh ngày biên lai và ngày duyệt. Đại lý lập bản kê ngay trong ngày
     * thu nên trùng ngày biên lai; hồ sơ chưa lập bản kê thì để trống.
     */
    reportDate: i % 4 === 3 ? null : businessDate(i),
    /*
     * Giới tính trên tệp nhập từ cổng BHXH, chỉ ghi khi lệch với dữ liệu đang
     * có. Đây là lỗi hay gặp nhất khi nhập Excel nên hệ thống cũ dành riêng một
     * cột để soát trước khi gửi hồ sơ đi.
     */
    importGender: i % 11 === 5 ? genderOf(i + 1) : null,
    // Ngày trên tệp nhập lệch với ngày biên lai — liệt kê trong khối "Lệch ngày"
    importDate: i % 13 === 7 ? businessDate(i + 4) : null,
  }),

  /** Hồ sơ điều chỉnh AR — cùng người tham gia, thêm loại điều chỉnh. */
  '/declarations/ar': (i) => ({
    householdNo: `92${String(22771905 + Math.floor(i / 3) * 1370).slice(0, 8)}`,
    insuranceNo: insuranceNo(i),
    fullName: pick(PEOPLE, i),
    idNo: idNoOf(i),
    birthDate: daysAgo(9000 + i * 130),
    gender: genderOf(i),
    changeType: pick(['Tăng mới', 'Giảm', 'Điều chỉnh mức đóng', 'Đổi nơi KCB'], i),
    amount: amountOf(i),
    receiptNo: `${serial('BL', i)}/025`,
    address: `${pick(HAMLETS, i)}, ${pick(WARDS, i)}`,
    wardName: pick(WARDS, i),
    agentName: pick(AGENTS, i),
    status: pick(['pending', 'approved', 'draft'], i),
    householdStatus: i % 5 === 2 ? 'suspect' : 'valid',
    submittedAt: businessDate(i),
    receiptDate: businessDate(i),
    approvedAt: i % 3 === 1 ? null : businessDate(i + 2),
    reportDate: i % 4 === 3 ? null : businessDate(i),
    importGender: i % 11 === 5 ? genderOf(i + 1) : null,
    importDate: i % 13 === 7 ? businessDate(i + 4) : null,
  }),

  /**
   * Danh sách người chưa tham gia BHXH tự nguyện, chờ lập D05.
   * `insuranceNo` rỗng là người chưa có mã số — hệ thống cũ hiện "Chưa có mã".
   */
  '/declarations/d05': (i) => {
    // Kỳ đóng quyết định số tháng, không phải hai số rời nhau: bộ lọc "giải pháp
    // đóng" và cột "Tháng/Mức" nói về cùng một điều
    const solution = solutionOf(i);
    const months = MONTHS_PER_SOLUTION[solution];
    const salaryBase = 1_500_000 + (i % 5) * 500_000;
    // Người lao động đóng 22% mức lương chọn, nhà nước hỗ trợ phần còn lại
    const total = Math.round(salaryBase * 0.22 * months);
    const support = Math.round(total * 0.1);

    return {
      insuranceNo: i % 4 === 0 ? null : insuranceNo(i),
      fullName: pick(PEOPLE, i),
      idNo: idNoOf(i),
      birthDate: daysAgo(9000 + i * 97),
      gender: genderOf(i),
      lastJoinedAt: i % 6 === 0 ? daysAgo(300 + i) : null,
      // Số tháng của kỳ tham gia gần nhất, hiện kèm ngày trên nhãn xanh
      lastJoinedMonths: (i % 12) + 1,
      wardName: pick(WARDS, i),
      provinceName: pick(PROVINCES, i),
      address: `${pick(HAMLETS, i)}, ${pick(WARDS, i)}`,
      salaryBase,
      months,
      amount: total,
      // Tổng phí quy đổi = phần người lao động nộp + phần nhà nước hỗ trợ
      employeeAmount: total - support,
      supportAmount: support,
      // Nộp chậm thì tính lãi; phần lớn hồ sơ nộp đúng hạn nên lãi bằng 0
      interest: i % 5 === 3 ? Math.round(total * 0.0322) : 0,
      payMethod: payMethodOf(i),
      solution,
      receiptNo: `${serial('BL', i)}/025`,
      agentName: pick(AGENTS, i),
      status: pick(['pending', 'approved', 'draft'], i),
      submittedAt: businessDate(i),
      receiptDate: businessDate(i),
      approvedAt: i % 3 === 1 ? null : businessDate(i + 2),
      reportDate: i % 4 === 3 ? null : businessDate(i),
    };
  },

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
  /**
   * Vết thao tác trên dữ liệu nghiệp vụ.
   *
   * Ghi theo bảng + id bản ghi (chứ không phải một câu mô tả) vì đây là dữ liệu
   * để đối chiếu: biết bảng nào, dòng nào đổi thì mới khôi phục lại được.
   * `idNo` giúp tra thẳng theo người tham gia mà không phải mở từng bản ghi.
   */
  '/audit-logs': (i) => ({
    actor: pick(PEOPLE, i),
    tableName: pick(AUDIT_TABLES, i),
    recordId: 1_000 + (i % 90_000),
    idNo: idNoOf(i),
    // Chỉ hai hành động này sinh ra khối lượng lớn; xoá là ngoại lệ
    action: i % 7 === 6 ? 'delete' : i % 3 === 0 ? 'create' : 'update',
    createdAt: daysAgo((i % 900) / 3),
  }),

  /**
   * Cài đặt hệ thống dạng danh sách: mỗi tham số một dòng, chia theo danh mục.
   *
   * `isSystem` là tham số do hệ thống quản lý — sửa được nhưng không xoá được,
   * nên trang chỉ cho "Reset" về mặc định thay vì xoá dòng.
   */
  '/system-settings': (i) => {
    const rows = [
      ['Tính toán', 'government_support_rate', 'Tỉ lệ nhà nước hỗ trợ', 'number', '10', true],
      ['Tính toán', 'interest_rate', 'Tỉ lệ lãi suất', 'number', '32.2', true],
      ['Tính toán', 'base_salary', 'Mức lương tối thiểu', 'number', '1500000', true],
      ['Tính toán', 'insurance_rate', 'Tỉ lệ đóng BHXH', 'number', '22', true],
      ['Tính toán', 'medical_insurance_rate', 'Tỉ lệ đóng BHYT', 'number', '0.045', true],
      ['Tính toán', 'base_salary_medical', 'Lương cơ bản BHYT', 'number', '2340000', true],
      ['Biên lai', 'receipt_prefix', 'Tiền tố số biên lai', 'string', 'BL', false],
      ['Biên lai', 'receipt_next_no', 'Số biên lai tiếp theo', 'number', '319', false],
      ['Biên lai', 'e_receipt_enabled', 'Bật biên lai điện tử', 'boolean', '1', false],
      ['Đơn vị', 'org_name', 'Tên đơn vị', 'string', 'Bảo hiểm xã hội tỉnh', false],
      ['Đơn vị', 'org_code', 'Mã đơn vị', 'string', 'BHXH-001', true],
      ['Đơn vị', 'org_email', 'E-mail liên hệ', 'string', 'lienhe@bhxh.gov.vn', false],
      ['Kết nối', 'gateway_url', 'Địa chỉ cổng tiếp nhận', 'string', 'https://gdbhxh.gov.vn', true],
      ['Kết nối', 'gateway_sync_enabled', 'Tự đồng bộ cổng BHXH', 'boolean', '0', false],
    ];
    const [category, key, label, valueType, value, isSystem] = rows[i % rows.length];

    return {
      category,
      key,
      label,
      valueType,
      value,
      isSystem,
      isActive: activeOf(i),
      updatedAt: daysAgo(60 - i),
    };
  },
};

/** Tổng số bản ghi giả cho từng endpoint, khớp badge trên sidebar. */
export const TOTALS = {
  '/provinces': 34,
  '/districts': 143,
  '/wards': 3_320,
  '/hamlets': 9422,
  '/medical-facilities': 2_236,
  '/relationships': 23,
  '/contribution-levels': 5,
  '/ethnicities': 9,
  '/base-salaries': 4,
  '/insurance-receipts': 214,
  '/payments': 76,
  '/receipts': 318,
  '/agents': 217,
  // 157.794 dòng BHYT + 2 dòng BHXH, cũng bằng 38.410 dòng nhập Excel +
  // 119.386 dòng do hệ thống sinh — hai cách chia của cùng một tập
  '/insurance-history': 157_796,
  '/permissions': 48,
  '/roles': 6,
  '/settings': 6,
  '/system-settings': 14,
  '/receipt-books': 41,
  '/declarations/d03': 17,
  '/declarations/ar': 12,
  '/declarations/d05': 1_138,
  '/system-logs': 132,
  '/audit-logs': 382_283,
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
    wards: 3320,
    hamlets: 9422,
    medicalFacilities: 2236,
    relationships: 23,
    contributionLevels: 5,
    ethnicities: 9,
    roles: 6,
    settings: 6,
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

/** Cộng tác viên trong báo cáo tổng hợp — số liệu chia theo kỳ đóng. */
const COLLABORATORS = [
  ['Lê Thị Mỹ Linh', 'BI0109B'],
  ['Đàm Thị Phương Nguyệt', 'BI0101F'],
  ['Nguyễn Thị Thảo', 'BI0101F'],
  ['Ngô Quang Trưởng', 'BI0100F'],
  ['Trần Ngọc Xuân Huyên', 'BI0146E'],
];

/**
 * Một dòng báo cáo tổng hợp: số thẻ và doanh thu tách theo kỳ đóng
 * (1 / 3 / 6 / 12 tháng). `paid` là số đã nộp về cơ quan BHXH, nên `diff`
 * âm nghĩa là còn phải nộp — đúng cách hệ thống cũ tính.
 */
const summaryRow = (index, scale) => {
  const [name, code] = COLLABORATORS[index % COLLABORATORS.length];
  const months12 = (4 + index * 3) * scale;
  const months6 = (index % 3) * scale;
  const months3 = (index % 2) * scale;

  const revenue = (months12 * 1_275_120 + months6 * 495_247 + months3 * 290_317) / scale;
  const paid = index % 4 === 0 ? Math.round(revenue / 2) : 0;

  return {
    collaboratorName: name,
    employeeCode: code,
    total: months12 + months6 + months3,
    months1: 0,
    months1Amount: 0,
    months3,
    months3Amount: Math.round(months3 * 290_317),
    months6,
    months6Amount: Math.round(months6 * 495_247),
    months12,
    months12Amount: Math.round(months12 * 1_275_120),
    revenue: Math.round(revenue),
    paid,
    diff: paid - Math.round(revenue),
  };
};

/** Hai bảng của báo cáo tổng hợp: D03 (BHYT) và D05 (BHXH). */
export const SUMMARY_REPORT = () => {
  const build = (count, scale) => Array.from({ length: count }, (_, i) => summaryRow(i, scale));

  const totalsOf = (rows) =>
    rows.reduce(
      (sum, row) => {
        Object.keys(row).forEach((key) => {
          if (typeof row[key] === 'number') sum[key] = (sum[key] ?? 0) + row[key];
        });
        return sum;
      },
      { id: 'total' },
    );

  const d03 = build(5, 1);
  const d05 = build(3, 1);

  return {
    d03: { data: d03, totals: totalsOf(d03) },
    d05: { data: d05, totals: totalsOf(d05) },
  };
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

