import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { stacked, sttColumn } from '@/features/resource/columns';
import { statusColumn } from '@/features/resource/status';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

/** Người tham gia: tên là thứ đọc trước, mã số BHXH ngay dưới để đối chiếu. */
const personColumn = {
  key: 'fullName',
  header: 'Thông tin KH',
  sortable: true,
  render: (row) =>
    stacked(
      <span className="font-medium text-gray-900">{row.fullName}</span>,
      row.insuranceNo ?? 'Chưa có mã BHXH',
    ),
};

/** Giới tính và ngày sinh — hai thông tin luôn được đọc cùng nhau. */
const genderBirthColumn = {
  key: 'gender',
  header: 'GT/Sinh',
  width: '9rem',
  render: (row) => stacked(row.gender ?? '—', formatDate(row.birthDate)),
};

/** Ngày ghi trên biên lai và ngày cơ quan BHXH duyệt; chưa duyệt thì nói rõ. */
const receiptDateColumn = {
  key: 'receiptDate',
  header: 'Ngày biên/duyệt',
  width: '10rem',
  sortable: true,
  render: (row) =>
    stacked(
      formatDate(row.receiptDate ?? row.submittedAt),
      row.approvedAt ? formatDate(row.approvedAt) : 'Chưa duyệt',
    ),
};

/**
 * Giới tính trên tệp nhập từ cổng BHXH khi lệch với dữ liệu đang có.
 *
 * Chỉ tô đỏ những dòng thật sự lệch: cột này để soát trước khi gửi hồ sơ, nếu
 * dòng nào cũng có nhãn thì mất tác dụng cảnh báo.
 */
const importGenderColumn = {
  key: 'importGender',
  header: 'Lệch GT (Import)',
  width: '9rem',
  render: (row) =>
    row.importGender ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <Icon name="warning" className="h-3.5 w-3.5" />
        {row.importGender}
      </span>
    ) : (
      <span className="text-xs text-gray-400">Khớp</span>
    ),
};

/** Hộ "nghi ngờ" là hộ cần kiểm tra lại trước khi gửi, nên tô đỏ. */
const householdStatusColumn = {
  key: 'householdStatus',
  header: 'Trạng thái hộ',
  width: '9rem',
  render: (row) =>
    row.householdStatus === 'suspect' ? (
      <span className="text-xs font-medium text-red-600">Nghi ngờ</span>
    ) : (
      <span className="text-xs text-green-700">Hợp lệ</span>
    ),
};

const idNoColumn = { key: 'idNo', header: 'CCCD/CMND', width: '11rem', sortable: true };

const agentColumn = { key: 'agentName', header: 'Đại lý', width: '13rem', sortable: true };

const amountColumn = {
  key: 'amount',
  header: 'Mức đóng',
  align: 'right',
  width: '10rem',
  sortable: true,
  render: (row) => <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>,
};

/** Loại điều chỉnh — thứ phân biệt hồ sơ AR với hồ sơ D03 của cùng một người. */
const changeTypeColumn = {
  key: 'changeType',
  header: 'Loại điều chỉnh',
  width: '12rem',
  sortable: true,
  render: (row) => <Badge tone="amber">{row.changeType ?? '—'}</Badge>,
};

/**
 * Cột của báo cáo D03 và AR — cùng mẫu biểu BHYT nên đọc theo hộ gia đình.
 *
 * AR chèn thêm cột "Loại điều chỉnh": hồ sơ AR nói về một thay đổi (tăng mới,
 * giảm, đổi nơi KCB), đọc mà không thấy loại thay đổi thì không biết dòng đó
 * điều chỉnh cái gì — và cột này cũng đã có trong cặp ô "Sắp xếp theo".
 */
const bhytColumns = (adjustments) => [
  sttColumn,
  personColumn,
  idNoColumn,
  genderBirthColumn,
  receiptDateColumn,
  ...(adjustments ? [changeTypeColumn] : []),
  agentColumn,
  { key: 'receiptNo', header: 'Biên lai', width: '10rem' },
  amountColumn,
  householdStatusColumn,
  importGenderColumn,
  statusColumn,
];

/**
 * Cột của báo cáo D05 (BHXH tự nguyện).
 *
 * Khác BHYT ở phần tiền: tổng phí quy đổi tách thành phần người lao động nộp và
 * phần nhà nước hỗ trợ, cộng thêm số tháng và lãi nộp chậm.
 */
const BHXH_COLUMNS = [
  sttColumn,
  personColumn,
  {
    key: 'gender',
    header: 'GT/CCCD',
    width: '11rem',
    render: (row) => stacked(row.gender ?? '—', row.idNo),
  },
  receiptDateColumn,
  agentColumn,
  {
    key: 'amount',
    header: 'Tổng phí QĐ',
    align: 'right',
    width: '11rem',
    sortable: true,
    render: (row) =>
      stacked(
        <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>,
        row.payMethod === 'online' ? 'ON' : 'TM',
      ),
    // Dòng tổng không có hình thức nộp nên chỉ hiện số tiền
    renderFooter: (totals) => formatCurrency(totals.amount),
  },
  {
    key: 'employeeAmount',
    header: 'NLĐ nộp',
    align: 'right',
    width: '11rem',
    render: (row) =>
      stacked(formatCurrency(row.employeeAmount), `Hỗ trợ ${formatCurrency(row.supportAmount)}`),
    renderFooter: (totals) => formatCurrency(totals.employeeAmount),
  },
  {
    key: 'months',
    header: 'Tháng/Lãi',
    align: 'right',
    width: '9rem',
    render: (row) =>
      stacked(
        `${row.months} tháng`,
        row.interest ? (
          <span className="text-red-600">{formatCurrency(row.interest)}</span>
        ) : (
          'Không lãi'
        ),
      ),
    // Cộng số tháng của nhiều người thì vô nghĩa; chỉ tổng lãi là đáng đọc
    renderFooter: (totals) => (
      <span className="text-red-600">Lãi {formatCurrency(totals.interest)}</span>
    ),
  },
  { key: 'address', header: 'Địa chỉ' },
  statusColumn,
];

export const REPORT_COLUMNS = {
  d03: bhytColumns(false),
  ar: bhytColumns(true),
  d05: BHXH_COLUMNS,
};

/**
 * Cột chọn được trong cặp ô "Sắp xếp theo".
 *
 * Bảng đã bấm được vào tiêu đề cột, nhưng bảng hơn mười cột phải cuộn ngang mới
 * thấy cột cần bấm — hệ thống cũ đặt sẵn hai ô chọn ở đây vì vậy.
 */
export const REPORT_SORT_OPTIONS = {
  d03: [
    { value: 'householdNo', label: 'Mã hộ' },
    { value: 'fullName', label: 'Họ và tên' },
    { value: 'receiptDate', label: 'Ngày biên' },
    { value: 'approvedAt', label: 'Ngày duyệt' },
    { value: 'amount', label: 'Mức đóng' },
  ],
  ar: [
    { value: 'householdNo', label: 'Mã hộ' },
    { value: 'fullName', label: 'Họ và tên' },
    { value: 'receiptDate', label: 'Ngày biên' },
    { value: 'changeType', label: 'Loại điều chỉnh' },
  ],
  d05: [
    { value: 'fullName', label: 'Họ và tên' },
    { value: 'receiptDate', label: 'Ngày biên' },
    { value: 'amount', label: 'Tổng phí QĐ' },
    { value: 'months', label: 'Số tháng' },
  ],
};

/**
 * Gom theo mã hộ, kèm dòng tóm tắt tổng tiền của hộ.
 *
 * Cơ quan BHXH duyệt theo hộ gia đình nên tổng tiền của từng hộ phải đọc được
 * ngay. Chỉ gom được các dòng **liền nhau**, vì vậy trang phải sắp xếp theo mã
 * hộ trước khi bảng nhận dữ liệu.
 */
export const householdGroup = {
  key: (row) => row.householdNo,
  label: (row, rows) => (
    <span className="flex flex-wrap items-center gap-2">
      <Badge tone="brand">Mã hộ {row.householdNo}</Badge>
      <span className="text-xs text-gray-600">{formatNumber(rows.length)} người</span>
    </span>
  ),
  summary: (rows) => (
    <span className="flex justify-between">
      <span>Tóm tắt hộ {rows[0].householdNo}</span>
      <span className="font-medium text-gray-900">
        Tổng {formatCurrency(rows.reduce((sum, row) => sum + (row.amount ?? 0), 0))}
      </span>
    </span>
  ),
};
