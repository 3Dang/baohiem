import { useMemo } from 'react';
import ResourceListPage from '@/features/resource/ResourceListPage';
import ToggleCell from '@/features/resource/ToggleCell';
import { useOptions } from '@/features/resource/useOptions';
import { stacked, sttColumn } from '@/features/resource/columns';
import { STATUS_OPTIONS, statusColumn } from '@/features/resource/status';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';
import ImportExcelButton from '@/components/ui/ImportExcelButton';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { downloadExport } from '@/lib/download';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { endOfMonthISO, monthOptions, startOfMonthISO, todayISO } from '@/lib/date';

const RECEIPT_TYPE_LABELS = { bhyt: 'BHYT', bhxh: 'BHXH', combined: 'BHYT + BHXH' };
const RECEIPT_TYPE_OPTIONS = Object.entries(RECEIPT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const INSURANCE_TYPE_OPTIONS = [
  { value: 'd03', label: 'D03 - BHYT hộ gia đình' },
  { value: 'd05', label: 'D05 - BHXH tự nguyện' },
];

const ATTACHMENT_OPTIONS = [
  { value: 'attached', label: 'Đã đính kèm' },
  { value: 'missing', label: 'Chưa đính kèm' },
];

const CONFIRM_OPTIONS = [
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'waiting', label: 'Chờ xác nhận' },
  { value: 'rejected', label: 'Không xác nhận' },
];

/** Khoảng ngày mặc định là tháng này — kỳ làm việc thường dùng nhất. */
const dateRangeFields = (label = 'ngày') => [
  {
    name: 'from',
    label: `Từ ${label}`,
    type: 'date',
    defaultValue: startOfMonthISO(),
    pair: 'range',
    chipLabel: (values) => `Từ ${formatDate(values.from)} đến ${formatDate(values.to)}`,
  },
  { name: 'to', label: `Đến ${label}`, type: 'date', defaultValue: endOfMonthISO(), pair: 'range' },
];

/** Cột số tiền: căn phải, đậm, vì đây là số người dùng đọc trước nhất. */
const amountColumn = (header = 'Số tiền') => ({
  key: 'amount',
  header,
  align: 'right',
  width: '11rem',
  sortable: true,
  render: (row) => <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>,
});

/**
 * Các mốc lương cơ sở dùng để tính mức đóng. Bản ghi không có ngày kết thúc
 * là mốc đang áp dụng, nên hiển thị khác đi thay vì để trống một ô.
 */
const BASE_SALARY_FIELDS = [
  {
    name: 'amount',
    label: 'Mức lương cơ sở',
    type: 'number',
    required: true,
    min: 0,
    step: 10000,
    placeholder: '2340000',
    hint: 'Đơn vị đồng, nhập số nguyên.',
  },
  { name: 'effectiveFrom', label: 'Hiệu lực từ', type: 'date', required: true },
  {
    name: 'effectiveTo',
    label: 'Hiệu lực đến',
    type: 'date',
    hint: 'Để trống nếu đây là mốc đang áp dụng.',
  },
  { name: 'note', label: 'Ghi chú', colSpan: 2, placeholder: 'Căn cứ Nghị định…' },
];

/** Mức lương cơ sở theo từng giai đoạn — căn cứ tính mức đóng. */
export function BaseSalaryPage() {
  const endpoint = endpoints.resources.baseSalary;

  return (
    <ResourceListPage
      title="Mức lương cơ sở"
      breadcrumb={[{ label: 'Base Salary' }, { label: 'Danh sách' }]}
      description="Các mốc lương cơ sở dùng làm căn cứ tính mức đóng BHXH tự nguyện và BHYT."
      endpoint={endpoint}
      searchPlaceholder="Tìm theo mức lương, ghi chú…"
      recordLabel="mốc lương cơ sở"
      createLabel="Tạo mới base salary"
      rowLabel={(row) => formatCurrency(row.amount)}
      formFields={BASE_SALARY_FIELDS}
      emptyDescription="Chưa khai báo mốc lương cơ sở nào."
      columns={[
        {
          key: 'amount',
          header: 'Salary',
          width: '14rem',
          sortable: true,
          render: (row) => (
            <span className="font-medium text-brand-800">{formatCurrency(row.amount)}</span>
          ),
        },
        {
          key: 'effectiveFrom',
          header: 'Hiệu lực từ',
          width: '10rem',
          sortable: true,
          render: (row) => formatDate(row.effectiveFrom),
        },
        {
          key: 'effectiveTo',
          header: 'Hiệu lực đến',
          width: '11rem',
          // Không có ngày kết thúc nghĩa là còn hiệu lực, không phải thiếu dữ liệu
          render: (row) =>
            row.effectiveTo ? (
              formatDate(row.effectiveTo)
            ) : (
              <span className="text-gray-500">Không giới hạn</span>
            ),
        },
        {
          key: 'isActive',
          header: 'Hoạt động',
          width: '8rem',
          render: (row) => <ToggleCell endpoint={endpoint} row={row} field="isActive" />,
        },
        { key: 'note', header: 'Ghi chú' },
      ]}
    />
  );
}

/** Biên lai bảo hiểm đã phát hành — lọc theo kỳ, loại biên lai, đại lý. */
export function InsuranceReceiptsPage() {
  const toast = useToast();
  const agentOptions = useOptions(endpoints.resources.agents);

  const filterFields = useMemo(
    () => [
      ...dateRangeFields(),
      {
        name: 'receiptType',
        label: 'Loại biên lai',
        options: RECEIPT_TYPE_OPTIONS,
        placeholder: 'Tất cả',
      },
      { name: 'status', label: 'Trạng thái', options: STATUS_OPTIONS, placeholder: 'Tất cả' },
      {
        name: 'agentName',
        label: 'Đại lý',
        options: agentOptions,
        placeholder: 'Tất cả',
      },
    ],
    [agentOptions],
  );

  return (
    <ResourceListPage
      title="Biên lai bảo hiểm"
      breadcrumb={[{ label: 'Biên Lai Bảo Hiểm' }, { label: 'Danh sách' }]}
      endpoint={endpoints.resources.insuranceReceipts}
      searchPlaceholder="Tìm theo số biên lai, mã số BHXH…"
      filterFields={filterFields}
      filterColumns={5}
      emptyDescription="Chưa có biên lai nào trong kỳ đang lọc."
      actions={({ exportParams }) => (
        <ExportButton
          endpoint={endpoints.reports.export('d03')}
          params={exportParams}
          fileBaseName="BaoCaoThu_BHXH_TuNguyen"
          label="Xuất báo cáo thu BHXH tự nguyện"
          icon="document"
        />
      )}
      bulkActions={[
        {
          key: 'confirm',
          label: 'Xác nhận đã thu',
          onRun: (ids) => toast.success(`Đã xác nhận ${ids.length} biên lai.`),
        },
        /*
         * Kết xuất theo `ids` chứ không theo bộ lọc: người dùng đã tự tay chọn
         * từng dòng nên tệp phải đúng những dòng đó. Giữ lựa chọn sau khi xuất
         * vì đây là hành động chỉ đọc — thường phải xuất tiếp mẫu khác.
         */
        {
          key: 'export',
          label: 'Xuất các dòng đã chọn',
          keepSelection: true,
          onRun: (ids) =>
            downloadExport(`${endpoints.resources.insuranceReceipts}/export`, {
              params: { ids: ids.join(',') },
              fileBaseName: 'BienLaiDaChon',
            }),
        },
      ]}
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem', sortable: true },
        { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem', sortable: true },
        { key: 'fullName', header: 'Người tham gia', sortable: true },
        {
          key: 'receiptType',
          header: 'Loại biên lai',
          width: '10rem',
          render: (row) => RECEIPT_TYPE_LABELS[row.receiptType] ?? '—',
        },
        amountColumn(),
        {
          key: 'issuedAt',
          header: 'Ngày phát hành',
          sortable: true,
          render: (row) => formatDate(row.issuedAt),
        },
        statusColumn,
      ]}
    />
  );
}

/** Các trường của phiếu nộp tiền — tạo mới trực tiếp trên trang danh sách. */
const PAYMENT_FIELDS = [
  { name: 'code', label: 'Số phiếu', required: true, placeholder: 'PN0001' },
  { name: 'agentName', label: 'Đại lý', required: true },
  { name: 'amount', label: 'Số tiền', type: 'number', required: true, min: 0, step: 1000 },
  { name: 'paidAt', label: 'Ngày nộp tiền', type: 'date', required: true },
  {
    name: 'insuranceType',
    label: 'Loại bảo hiểm',
    options: INSURANCE_TYPE_OPTIONS,
    placeholder: 'Chọn bảo hiểm',
    required: true,
  },
  { name: 'status', label: 'Trạng thái', options: STATUS_OPTIONS, defaultValue: 'draft' },
];

/** Phiếu nộp tiền của đại lý về cơ quan BHXH. */
export function PaymentsPage() {
  const agentOptions = useOptions(endpoints.resources.agents);
  const districtOptions = useOptions(endpoints.resources.districts);

  // Bộ lọc chia ba nhóm như hệ thống cũ: kỳ nộp, đại lý, loại bảo hiểm
  const filterFields = useMemo(
    () => [
      {
        name: 'from',
        label: 'Từ',
        type: 'date',
        group: 'Ngày nộp tiền',
        groupIcon: 'calendar',
        groupHint: 'Lọc theo thời gian nộp tiền',
        defaultValue: startOfMonthISO(),
        pair: 'range',
        chipLabel: (values) => `Từ ${formatDate(values.from)} đến ${formatDate(values.to)}`,
      },
      {
        name: 'to',
        label: 'Đến',
        type: 'date',
        group: 'Ngày nộp tiền',
        defaultValue: todayISO(),
        pair: 'range',
      },
      {
        name: 'districtName',
        label: 'Quận/ Huyện',
        group: 'Thông tin đại lý',
        groupIcon: 'user',
        groupHint: 'Lọc theo khu vực và đại lý',
        options: districtOptions,
        placeholder: '-- Chọn quận/huyện --',
      },
      {
        name: 'agentName',
        label: 'Đại lý',
        group: 'Thông tin đại lý',
        options: agentOptions,
        placeholder: '-- Chọn đại lý --',
      },
      {
        name: 'insuranceType',
        label: 'Loại bảo hiểm',
        group: 'Loại bảo hiểm',
        groupIcon: 'shield',
        groupHint: 'Lọc theo loại hồ sơ và trạng thái',
        options: INSURANCE_TYPE_OPTIONS,
        placeholder: 'Chọn bảo hiểm',
      },
      {
        name: 'attachmentStatus',
        label: 'Trạng thái đính kèm',
        group: 'Loại bảo hiểm',
        options: ATTACHMENT_OPTIONS,
        placeholder: 'Chọn',
      },
      {
        name: 'confirmStatus',
        label: 'Trạng thái xác nhận',
        group: 'Loại bảo hiểm',
        options: CONFIRM_OPTIONS,
        placeholder: 'Chọn',
      },
    ],
    [agentOptions, districtOptions],
  );

  return (
    <ResourceListPage
      title="Quản lý nộp tiền"
      breadcrumb={[{ label: 'Quản Lý Nộp Tiền' }, { label: 'Danh sách' }]}
      description="Phiếu nộp tiền của đại lý thu."
      endpoint={endpoints.resources.payments}
      searchPlaceholder="Tìm theo số phiếu, đại lý…"
      recordLabel="Quản lý nộp tiền"
      createLabel="Tạo mới Quản lý nộp tiền"
      rowLabel={(row) => row.code}
      formFields={PAYMENT_FIELDS}
      filterFields={filterFields}
      emptyDescription="Bắt đầu tạo dữ liệu mới"
      toolbar={({ exportParams }) => (
        <ExportButton
          endpoint={`${endpoints.resources.payments}/export`}
          params={exportParams}
          fileBaseName="QuanLyNopTien"
          label="Xuất Excel"
        />
      )}
      columns={[
        { key: 'code', header: 'Số phiếu', width: '10rem', sortable: true },
        { key: 'agentName', header: 'Đại lý', sortable: true },
        { key: 'districtName', header: 'Quận/huyện', width: '12rem' },
        {
          key: 'insuranceType',
          header: 'Loại bảo hiểm',
          width: '8rem',
          render: (row) => (row.insuranceType ?? '—').toUpperCase(),
        },
        amountColumn(),
        {
          key: 'paidAt',
          header: 'Ngày nộp',
          sortable: true,
          render: (row) => formatDate(row.paidAt),
        },
        {
          key: 'attachmentStatus',
          header: 'Đính kèm',
          width: '9rem',
          render: (row) => (
            <Badge tone={row.attachmentStatus === 'attached' ? 'green' : 'amber'}>
              {row.attachmentStatus === 'attached' ? 'Đã đính kèm' : 'Chưa đính kèm'}
            </Badge>
          ),
        },
        statusColumn,
      ]}
    />
  );
}

/**
 * Biên lai thu tiền (bản giấy).
 *
 * Ba hành động ở đầu trang đúng như hệ thống cũ: nhập dữ liệu từ cổng BHXH,
 * xuất dữ liệu thô, và xem báo cáo. Hai cái sau chỉ là điều hướng nên dùng
 * liên kết, không phải nút gọi API.
 */
export function ReceiptsPage() {
  const toast = useToast();
  const agentOptions = useOptions(endpoints.resources.agents);
  const districtOptions = useOptions(endpoints.resources.districts);

  const filterFields = useMemo(
    () => [
      {
        name: 'status',
        label: 'Trạng thái',
        options: STATUS_OPTIONS,
        placeholder: 'Chọn một tuỳ chọn',
      },
      {
        name: 'agentName',
        label: 'Chọn đại lý',
        options: agentOptions,
        placeholder: 'Chọn một tuỳ chọn',
      },
      {
        name: 'receiptType',
        label: 'Chọn loại biên',
        options: RECEIPT_TYPE_OPTIONS,
        placeholder: 'Chọn một tuỳ chọn',
      },
      {
        name: 'month',
        label: 'Tháng cấp lại',
        options: monthOptions(),
        placeholder: 'Chọn tháng',
      },
      ...dateRangeFields(),
      {
        name: 'districtName',
        label: 'Quận huyện',
        options: districtOptions,
        placeholder: 'Chọn một tuỳ chọn',
      },
    ],
    [agentOptions, districtOptions],
  );

  return (
    <ResourceListPage
      title="Biên lai"
      breadcrumb={[{ label: 'Biên Lai' }, { label: 'Danh sách' }]}
      endpoint={endpoints.resources.receipts}
      searchPlaceholder="Tìm theo số biên lai, người tham gia…"
      filterFields={filterFields}
      emptyDescription="Chưa có biên lai nào khớp điều kiện đang lọc."
      actions={({ exportParams }) => (
        <>
          <Button variant="secondary" onClick={() => toast.info('Đang kết nối cổng BHXH…')}>
            <Icon name="building" className="h-4 w-4" />
            Nhập từ bhxh
          </Button>
          <ExportButton
            endpoint={`${endpoints.resources.receipts}/export`}
            params={exportParams}
            fileBaseName="BienLai_DuLieuTho"
            label="Xuất dữ liệu thô"
            variant="secondary"
            icon="document"
          />
          <Button to="/reports/d03" variant="secondary">
            <Icon name="chart" className="h-4 w-4" />
            Báo cáo
          </Button>
        </>
      )}
      bulkActions={[
        {
          key: 'confirm',
          label: 'Xác nhận đã thu',
          onRun: (ids) => toast.success(`Đã xác nhận ${ids.length} biên lai.`),
        },
        {
          key: 'export',
          label: 'Xuất các dòng đã chọn',
          keepSelection: true,
          onRun: (ids) =>
            downloadExport(`${endpoints.resources.receipts}/export`, {
              params: { ids: ids.join(',') },
              fileBaseName: 'BienLaiDaChon',
            }),
        },
      ]}
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem', sortable: true },
        { key: 'bookNo', header: 'Số sổ', width: '8rem', sortable: true },
        { key: 'fullName', header: 'Người tham gia', sortable: true },
        {
          key: 'receiptType',
          header: 'Loại biên',
          width: '10rem',
          render: (row) => RECEIPT_TYPE_LABELS[row.receiptType] ?? '—',
        },
        amountColumn(),
        {
          key: 'issuedAt',
          header: 'Ngày thu',
          sortable: true,
          render: (row) => formatDate(row.issuedAt),
        },
        { key: 'collectorName', header: 'Người thu' },
        statusColumn,
      ]}
    />
  );
}

/** Biên lai điện tử — thêm cột mã tra cứu và thời điểm gửi. */
export function EReceiptsPage() {
  const toast = useToast();
  const agentOptions = useOptions(endpoints.resources.agents);

  const filterFields = useMemo(
    () => [
      ...dateRangeFields('ngày gửi'),
      {
        name: 'receiptType',
        label: 'Loại biên lai',
        options: RECEIPT_TYPE_OPTIONS,
        placeholder: 'Tất cả',
      },
      { name: 'status', label: 'Trạng thái', options: STATUS_OPTIONS, placeholder: 'Tất cả' },
      { name: 'agentName', label: 'Đại lý', options: agentOptions, placeholder: 'Tất cả' },
    ],
    [agentOptions],
  );

  return (
    <ResourceListPage
      title="Biên lai điện tử"
      breadcrumb={[{ label: 'Biên Lai Điện Tử' }, { label: 'Danh sách' }]}
      endpoint={endpoints.resources.insuranceReceipts}
      filters={{ type: 'electronic' }}
      filterFields={filterFields}
      filterColumns={5}
      searchPlaceholder="Tìm theo số biên lai, mã tra cứu…"
      emptyDescription="Chưa có biên lai điện tử nào trong kỳ đang lọc."
      actions={({ exportParams }) => (
        <ExportButton
          endpoint={endpoints.reports.export('d05')}
          params={exportParams}
          fileBaseName="BaoCaoThu_BHXH_TuNguyen"
          label="Xuất báo cáo thu BHXH tự nguyện"
          icon="document"
        />
      )}
      bulkActions={[
        {
          key: 'resend',
          label: 'Gửi lại cho người tham gia',
          onRun: (ids) => toast.success(`Đã gửi lại ${ids.length} biên lai điện tử.`),
        },
      ]}
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem', sortable: true },
        { key: 'lookupCode', header: 'Mã tra cứu', width: '10rem' },
        { key: 'fullName', header: 'Người tham gia', sortable: true },
        amountColumn(),
        {
          key: 'sentAt',
          header: 'Thời điểm gửi',
          sortable: true,
          render: (row) => formatDateTime(row.sentAt),
        },
        statusColumn,
      ]}
    />
  );
}

/** Trạng thái trả biên của một quyển biên lai. */
const RETURN_LABELS = { pending: 'Chưa trả', returned: 'Đã trả' };

/**
 * Dải tab của trang Quản lý quyển: tất cả, rồi từng trạng thái trả biên.
 *
 * Sinh từ `RETURN_LABELS` để nhãn trên tab và nhãn trong cột Trạng thái không
 * bao giờ lệch nhau. `counted` để mỗi tab hiện số quyển — đây là con số người
 * dùng cần nhất ở trang này: còn bao nhiêu quyển chưa thu về.
 */
const RETURN_TABS = {
  name: 'returnStatus',
  counted: true,
  items: [
    { value: '', label: 'All' },
    ...Object.entries(RETURN_LABELS).map(([value, label]) => ({ value, label })),
  ],
};

/** Các trường của quyển biên lai giao cho đại lý. */
const RECEIPT_BOOK_FIELDS = [
  { name: 'code', label: 'Số quyển', required: true, placeholder: 'Q0001' },
  { name: 'agentName', label: 'Đại lý', required: true },
  { name: 'fromNo', label: 'Từ số biên lai', required: true, placeholder: 'BL0001' },
  { name: 'toNo', label: 'Đến số biên lai', required: true, placeholder: 'BL0050' },
  { name: 'issuedAt', label: 'Ngày giao quyển', type: 'date', required: true },
  { name: 'returnedAt', label: 'Ngày trả biên', type: 'date', hint: 'Để trống nếu chưa trả.' },
];

/**
 * Quản lý quyển biên lai giao cho đại lý thu.
 *
 * Ba dải tab là ba tập con của cùng một danh sách (tất cả / chưa trả / đã trả),
 * nên chúng chỉ đặt thêm một điều kiện lọc chứ không phải ba trang riêng.
 */
export function ReceiptBooksPage() {
  const agentOptions = useOptions(endpoints.resources.agents);
  const districtOptions = useOptions(endpoints.resources.districts);

  const filterFields = useMemo(
    () => [
      {
        name: 'districtName',
        label: 'Quận/Huyện',
        group: 'Thông tin đại lý',
        groupIcon: 'user',
        groupHint: 'Lọc theo khu vực và đại lý',
        options: districtOptions,
        placeholder: '-- Chọn quận/huyện --',
      },
      {
        name: 'agentName',
        label: 'Đại lý',
        group: 'Thông tin đại lý',
        options: agentOptions,
        placeholder: '-- Chọn đại lý --',
      },
      /*
       * Khoảng ngày này lọc theo **ngày trả biên**, không phải ngày giao quyển —
       * hai mốc khác nhau của cùng một quyển. Tên tham số nói rõ mốc nào, như
       * `approvedFrom`/`approvedTo` ở trang báo cáo, để backend không phải đoán.
       *
       * Để trống mặc định: quyển chưa trả thì không có ngày trả, nên chốt sẵn
       * một khoảng ngày sẽ làm tab "Chưa trả" — tab người dùng vào xem nhiều
       * nhất — luôn rỗng.
       */
      {
        name: 'returnedFrom',
        label: 'Từ ngày',
        type: 'date',
        group: 'Ngày trả biên',
        groupIcon: 'calendar',
        groupHint: 'Lọc theo thời gian trả biên',
        pair: 'range',
        chipLabel: (values) =>
          `Trả biên ${formatDate(values.returnedFrom)} đến ${formatDate(values.returnedTo)}`,
      },
      {
        name: 'returnedTo',
        label: 'Đến ngày',
        type: 'date',
        group: 'Ngày trả biên',
        pair: 'range',
      },
      // Không có ô "Trạng thái trả" ở đây: dải tab bên trên đã đặt điều kiện đó.
      // Hai chỗ cùng điều khiển một trường thì tab luôn thắng, và chip bộ lọc sẽ
      // ghi một điều kiện khác với điều kiện bảng đang thực sự lọc.
    ],
    [agentOptions, districtOptions],
  );

  return (
    <ResourceListPage
      title="Quản lý quyển"
      breadcrumb={[{ label: 'Quản Lý Quyển' }, { label: 'Danh sách' }]}
      description="Quyển biên lai giao cho đại lý thu và tình trạng trả biên."
      endpoint={endpoints.resources.receiptBooks}
      searchPlaceholder="Tìm theo số quyển, số biên lai, đại lý…"
      recordLabel="quyển biên lai"
      rowLabel={(row) => row.code}
      formFields={RECEIPT_BOOK_FIELDS}
      filterFields={filterFields}
      tabs={RETURN_TABS}
      emptyDescription="Chưa có quyển biên lai nào khớp điều kiện đang lọc."
      /*
       * Ba nút xuất đều theo bộ lọc đang áp dụng (đại lý, quận/huyện, ngày trả),
       * nhưng mỗi nút tự chốt `returnStatus` của nó: nhãn nút đã nói rõ xuất tập
       * nào, nên nó phải thắng tab đang chọn — đứng ở tab "Chưa trả" mà bấm
       * "Xuất quyển đã trả" thì không thể nhận về một tệp rỗng.
       */
      actions={({ exportParams }) => (
        <>
          <ExportButton
            endpoint={endpoints.receiptBooks.returnReport}
            params={{ ...exportParams, returnStatus: 'returned' }}
            fileBaseName="BienBanTraLai"
            label="Xuất biên bản trả lại"
            icon="download"
          />
          <ExportButton
            endpoint={endpoints.receiptBooks.returnReport}
            params={{ ...exportParams, returnStatus: 'pending' }}
            fileBaseName="BienBanChuaTra"
            label="Xuất biên bản chưa trả"
            icon="download"
          />
          <ExportButton
            endpoint={`${endpoints.resources.receiptBooks}/export`}
            params={{ ...exportParams, returnStatus: 'returned' }}
            fileBaseName="QuyenDaTra"
            label="Xuất quyển đã trả"
            icon="download"
          />
        </>
      )}
      columns={[
        { key: 'code', header: 'Số quyển', width: '9rem', sortable: true },
        {
          key: 'fromNo',
          header: 'Khoảng số biên lai',
          width: '14rem',
          render: (row) => `${row.fromNo} → ${row.toNo}`,
        },
        { key: 'agentName', header: 'Đại lý', sortable: true },
        { key: 'districtName', header: 'Quận/huyện', width: '12rem' },
        {
          key: 'issuedAt',
          header: 'Ngày giao',
          width: '10rem',
          sortable: true,
          render: (row) => formatDate(row.issuedAt),
        },
        {
          key: 'returnedAt',
          header: 'Ngày trả biên',
          width: '11rem',
          // Chưa trả thì nói rõ, không để ô trống trông như thiếu dữ liệu
          render: (row) =>
            row.returnedAt ? (
              formatDate(row.returnedAt)
            ) : (
              <span className="text-gray-500">Chưa trả</span>
            ),
        },
        {
          key: 'returnStatus',
          header: 'Trạng thái',
          width: '9rem',
          render: (row) => (
            <Badge tone={row.returnStatus === 'returned' ? 'green' : 'amber'}>
              {RETURN_LABELS[row.returnStatus] ?? '—'}
            </Badge>
          ),
        },
      ]}
    />
  );
}

/** Các trường của đại lý thu. */
const AGENT_FIELDS = [
  { name: 'code', label: 'Mã đại lý', required: true, placeholder: 'DL0001' },
  { name: 'name', label: 'Tên đại lý', required: true },
  {
    name: 'officialName',
    label: 'Tên đại lý chính thức',
    colSpan: 2,
    hint: 'Tên ghi trên quyết định uỷ quyền, dùng khi in biên bản.',
  },
  { name: 'email', label: 'E-mail', type: 'email', placeholder: 'daily001@happylee.vn' },
  { name: 'phone', label: 'Điện thoại', type: 'tel', placeholder: '0901234567' },
  { name: 'bhytCode', label: 'Mã BHYT', placeholder: 'YT10450' },
  { name: 'bhxhCode', label: 'Mã BHXH', placeholder: 'XH20310' },
  { name: 'provinceName', label: 'Tỉnh/thành' },
  { name: 'districtName', label: 'Quận/huyện' },
  { name: 'wardName', label: 'Xã/phường quản lý (mới)' },
  {
    name: 'oldWardName',
    label: 'Xã/phường (cũ)',
    hint: 'Tên trước sáp nhập, giữ để tra hồ sơ đã nộp.',
  },
  // Không đưa `isActive` và `eReceiptEnabled` vào form: hai cột trên bảng đã có
  // công tắc bật/tắt, sửa ngay tại dòng nhanh hơn mở hộp thoại
];

/**
 * Đại lý thu và người dùng thuộc đại lý.
 *
 * Bảng theo hệ thống cũ: tên chính thức và e-mail là hai thứ dùng để đối chiếu
 * khi in biên bản, hai mã BHYT/BHXH là mã đơn vị khai báo với cơ quan BHXH, còn
 * xã/phường hiện cả tên mới và tên cũ vì hồ sơ nộp trước sáp nhập vẫn ghi tên cũ.
 *
 * Bốn hành động của dòng gom vào menu Thao tác: cấp quyền và đặt lại mật khẩu là
 * việc trên tài khoản người dùng của đại lý, chưa có API nên báo bằng toast.
 */
export function AgentsPage() {
  const toast = useToast();
  const endpoint = endpoints.resources.agents;
  const provinceOptions = useOptions(endpoints.resources.provinces);
  const districtOptions = useOptions(endpoints.resources.districts);
  const wardOptions = useOptions(endpoints.resources.wards);

  const filterFields = useMemo(
    () => [
      { name: 'provinceName', label: 'Tỉnh/thành', options: provinceOptions, placeholder: 'Tất cả' },
      {
        name: 'districtName',
        label: 'Quận/huyện',
        options: districtOptions,
        placeholder: 'Tất cả',
      },
      { name: 'wardName', label: 'Xã/phường', options: wardOptions, placeholder: 'Tất cả' },
      {
        name: 'eReceiptEnabled',
        label: 'Biên lai điện tử',
        options: [
          { value: 'true', label: 'Đã bật' },
          { value: 'false', label: 'Chưa bật' },
        ],
        placeholder: 'Tất cả',
      },
    ],
    [provinceOptions, districtOptions, wardOptions],
  );

  return (
    <ResourceListPage
      title="Quản lý đại lý"
      breadcrumb={[{ label: 'Quản Lý Đại Lý' }, { label: 'Danh sách' }]}
      description="Đại lý thu và tài khoản người dùng thuộc đại lý."
      endpoint={endpoint}
      searchPlaceholder="Tìm theo tên, mã đại lý, e-mail…"
      recordLabel="đại lý"
      createLabel="Tạo mới đại lý"
      formFields={AGENT_FIELDS}
      filterFields={filterFields}
      filterColumns={4}
      perPage={50}
      emptyDescription="Chưa khai báo đại lý thu nào."
      rowActions={[
        { key: 'edit', label: 'Chỉnh sửa', icon: 'pencil' },
        {
          key: 'permissions',
          label: 'Cấp quyền',
          icon: 'key',
          onRun: (row) => toast.info(`Đang mở phân quyền của ${row.name}.`),
        },
        {
          key: 'password',
          label: 'Đặt lại mật khẩu',
          icon: 'refresh',
          onRun: (row) => toast.success(`Đã gửi mật khẩu mới tới ${row.email}.`),
        },
        {
          key: 'disable',
          label: 'Vô hiệu hoá',
          icon: 'ban',
          tone: 'danger',
          onRun: (row) => toast.info(`Đã vô hiệu hoá ${row.name}.`),
        },
      ]}
      columns={[
        sttColumn,
        {
          key: 'officialName',
          header: 'Tên đại lý chính thức',
          sortable: true,
          // Tên gọi tắt là thứ người dùng nhận ra, tên chính thức để đối chiếu
          render: (row) =>
            stacked(<span className="font-medium text-gray-900">{row.name}</span>, row.officialName),
        },
        {
          key: 'email',
          header: 'Email',
          width: '15rem',
          sortable: true,
          render: (row) => (
            <span className="inline-flex items-center gap-1 text-gray-700">
              <Icon name="mail" className="h-3.5 w-3.5 text-gray-400" />
              {row.email}
            </span>
          ),
        },
        {
          key: 'eReceiptEnabled',
          header: 'Biên lai ĐT',
          align: 'center',
          width: '8rem',
          render: (row) => (
            <ToggleCell
              endpoint={endpoint}
              row={row}
              field="eReceiptEnabled"
              label="Biên lai điện tử"
            />
          ),
        },
        { key: 'bhytCode', header: 'Mã BHYT', width: '8rem', sortable: true },
        { key: 'bhxhCode', header: 'Mã BHXH', width: '8rem', sortable: true },
        {
          key: 'wardName',
          header: 'Xã/Phường quản lý (Mới)',
          width: '15rem',
          // Hồ sơ nộp trước sáp nhập ghi tên xã cũ, nên giữ cả hai để tra cứu
          render: (row) => stacked(row.wardName, `Cũ: ${row.oldWardName ?? '—'}`),
        },
        { key: 'phone', header: 'Điện thoại', width: '10rem' },
        {
          key: 'isActive',
          header: 'Hoạt động',
          width: '8rem',
          render: (row) => <ToggleCell endpoint={endpoint} row={row} field="isActive" />,
        },
      ]}
    />
  );
}

/** Nhãn của hai chiều chia dữ liệu lịch sử: loại bảo hiểm và nguồn dòng dữ liệu. */
const HISTORY_TYPES = {
  d03: { label: 'BHYT (D03)', tone: 'brand' },
  d05: { label: 'BHXH (D05)', tone: 'green' },
};
const HISTORY_SOURCES = {
  import: { label: 'Import', tone: 'amber', icon: 'upload' },
  system: { label: 'Hệ thống', tone: 'gray', icon: 'cog' },
};

/**
 * Lịch sử bảo hiểm — mỗi dòng là một lần hạn thẻ của một người thay đổi.
 *
 * Dải tab cắt cùng một tập theo ba chiều khác nhau (loại bảo hiểm, nguồn dữ
 * liệu, thời gian) nên mỗi tab mang bộ lọc riêng thay vì cùng chọn giá trị cho
 * một trường. `counted` để mỗi tab hiện số dòng của tập con đó: người dùng cần
 * biết trong 157.796 dòng thì bao nhiêu dòng đến từ tệp Excel của đại lý.
 *
 * Ba nút đầu trang là các việc theo lô của hệ thống cũ; phần chưa có API thì
 * báo bằng toast để không thành nút bấm không phản hồi.
 */
export function InsuranceHistoryPage() {
  const toast = useToast();
  const filterFields = useMemo(
    () => [
      /*
       * Chỉ lọc theo thời gian ghi nhận: loại bảo hiểm và nguồn dữ liệu đã do
       * dải tab đảm nhiệm, thêm vào đây nữa thì hai chỗ cùng điều khiển một
       * điều kiện và người dùng không biết cái nào đang có hiệu lực.
       *
       * Để trống mặc định, khác các trang nghiệp vụ khác: đây là bảng tra cứu cả
       * quá trình tham gia, chốt sẵn vào tháng này thì con số trên các tab chỉ
       * còn là một phần nhỏ và không nói lên điều gì.
       */
      {
        name: 'from',
        label: 'Ghi nhận từ',
        type: 'date',
        pair: 'range',
        chipLabel: (values) => `Ghi nhận ${formatDate(values.from)} – ${formatDate(values.to)}`,
      },
      { name: 'to', label: 'Ghi nhận đến', type: 'date', pair: 'range' },
    ],
    [],
  );

  return (
    <ResourceListPage
      title="Lịch sử bảo hiểm"
      breadcrumb={[{ label: 'Lịch Sử Bảo Hiểm' }, { label: 'Danh sách' }]}
      description="Quá trình tham gia của từng người, tra theo mã số BHXH hoặc số CCCD."
      endpoint={endpoints.resources.insuranceHistory}
      searchPlaceholder="Nhập mã số BHXH, CCCD hoặc họ tên…"
      filterFields={filterFields}
      filterColumns={2}
      perPage={25}
      tabs={{
        counted: true,
        items: [
          { value: '', label: 'Tất cả' },
          { value: 'd03', label: 'BHYT (D03)', filters: { insuranceType: 'd03' } },
          { value: 'd05', label: 'BHXH (D05)', filters: { insuranceType: 'd05' } },
          { value: 'import', label: 'Import', filters: { source: 'import' } },
          { value: 'system', label: 'Hệ thống', filters: { source: 'system' } },
          // "Gần đây" tính theo số ngày, không phải một giá trị của trường nào
          { value: 'recent', label: '7 ngày gần đây', filters: { recent: 7 } },
        ],
      }}
      emptyDescription="Không có dòng lịch sử nào khớp điều kiện đang lọc."
      actions={
        <>
          <ImportExcelButton
            endpoint={endpoints.insuranceHistory.import}
            label="Import Timeline"
            title="Nhập lịch sử tham gia từ Excel"
          />
          <ExportButton
            endpoint={endpoints.insuranceHistory.template}
            fileBaseName="Mau_LichSuBaoHiem"
            label="Tải mẫu Excel"
            variant="secondary"
            icon="download"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('Đang so khớp với dữ liệu cổng BHXH…')}
          >
            <Icon name="refresh" className="h-4 w-4" />
            So khớp dữ liệu BHXH
          </Button>
        </>
      }
      rowActions={[
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: 'eye',
          onRun: (row) => toast.info(`Đang mở quá trình tham gia của ${row.fullName}.`),
        },
      ]}
      columns={[
        {
          key: 'fullName',
          header: 'Khách hàng',
          sortable: true,
          render: (row) => stacked(<span className="font-medium">{row.fullName}</span>, row.idNo),
        },
        { key: 'insuranceNo', header: 'Mã BHXH', width: '11rem', sortable: true },
        {
          key: 'insuranceType',
          header: 'Loại BH',
          width: '9rem',
          render: (row) => {
            const config = HISTORY_TYPES[row.insuranceType];
            return config ? <Badge tone={config.tone}>{config.label}</Badge> : '—';
          },
        },
        {
          key: 'fromDate',
          header: 'Hạn cũ',
          width: '10rem',
          sortable: true,
          render: (row) => <span className="text-gray-500">{formatDate(row.fromDate)}</span>,
        },
        {
          key: 'toDate',
          header: 'Hạn mới',
          width: '10rem',
          sortable: true,
          // Hạn mới là thứ người dùng tra cứu, nên tô đậm hơn hạn cũ
          render: (row) => (
            <span className="font-medium text-gray-900">{formatDate(row.toDate)}</span>
          ),
        },
        {
          key: 'source',
          header: 'Nguồn',
          width: '10rem',
          render: (row) => {
            const config = HISTORY_SOURCES[row.source];
            if (!config) return '—';

            return (
              <Badge tone={config.tone} className="gap-1">
                <Icon name={config.icon} className="h-3 w-3" />
                {config.label}
              </Badge>
            );
          },
        },
        { key: 'reason', header: 'Lý do' },
        {
          key: 'createdAt',
          header: 'Thời gian',
          width: '12rem',
          sortable: true,
          render: (row) => formatDateTime(row.createdAt),
        },
      ]}
    />
  );
}

/** Danh sách quyền hệ thống (chỉ đọc, sinh từ backend). */
export function PermissionsPage() {
  return (
    <ResourceListPage
      title="Quản lý quyền"
      breadcrumb={[{ label: 'Quản Lý Quyền' }, { label: 'Danh sách' }]}
      description="Danh sách quyền được hệ thống sinh ra theo từng chức năng."
      endpoint={endpoints.resources.permissions}
      searchPlaceholder="Tìm theo tên quyền…"
      emptyDescription="Không có quyền nào khớp từ khoá."
      columns={[
        { key: 'name', header: 'Tên quyền', sortable: true },
        { key: 'group', header: 'Nhóm chức năng', sortable: true },
        { key: 'description', header: 'Mô tả' },
      ]}
    />
  );
}

/** Các trường của vai trò. */
const ROLE_FIELDS = [
  { name: 'name', label: 'Tên vai trò', required: true, placeholder: 'Nhân viên đại lý' },
  {
    name: 'guardName',
    label: 'Tên guard',
    defaultValue: 'web',
    hint: 'Mặc định `web` — đổi khi vai trò dùng cho API riêng.',
  },
  { name: 'description', label: 'Mô tả', colSpan: 2 },
];

/** Vai trò và số quyền/số người dùng đang gán. */
export function RolesPage() {
  return (
    <ResourceListPage
      title="Vai trò"
      breadcrumb={[{ label: 'Vai Trò' }, { label: 'Danh sách' }]}
      endpoint={endpoints.resources.roles}
      searchPlaceholder="Tìm theo tên vai trò…"
      recordLabel="vai trò"
      createLabel="Tạo mới Vai trò"
      formFields={ROLE_FIELDS}
      perPage={10}
      emptyDescription="Chưa khai báo vai trò nào."
      columns={[
        {
          key: 'name',
          header: 'Tên',
          sortable: true,
          render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
        },
        {
          key: 'guardName',
          header: 'Tên guard',
          width: '10rem',
          render: (row) => <Badge tone="amber">{row.guardName ?? 'web'}</Badge>,
        },
        {
          key: 'permissionsCount',
          header: 'Quyền',
          width: '8rem',
          sortable: true,
          render: (row) => <Badge tone="green">{row.permissionsCount ?? 0}</Badge>,
        },
        { key: 'usersCount', header: 'Số người dùng', align: 'right', width: '10rem' },
        {
          key: 'updatedAt',
          header: 'Cập nhật lúc',
          width: '13rem',
          sortable: true,
          render: (row) => formatDateTime(row.updatedAt ?? row.createdAt),
        },
      ]}
    />
  );
}
