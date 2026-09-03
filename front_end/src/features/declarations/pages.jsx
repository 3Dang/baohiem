import { useMemo } from 'react';
import ResourceListPage from '@/features/resource/ResourceListPage';
import { useOptions } from '@/features/resource/useOptions';
import { stacked, sttColumn } from '@/features/resource/columns';
import { STATUS_OPTIONS, statusColumn } from '@/features/resource/status';
import Badge from '@/components/ui/Badge';
import ExportButton from '@/components/ui/ExportButton';
import ImportExcelButton from '@/components/ui/ImportExcelButton';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { todayISO } from '@/lib/date';

/** Cặp ngày lọc theo mốc biên lai / báo cáo, mặc định là hôm nay. */
const rangeField = (name, label, group, extra = {}) => ({
  name,
  label,
  type: 'date',
  group,
  defaultValue: todayISO(),
  ...extra,
});

const SOLUTION_OPTIONS = [
  { value: 'monthly', label: 'Đóng hằng tháng' },
  { value: 'quarterly', label: 'Đóng 3 tháng' },
  { value: 'yearly', label: 'Đóng 12 tháng' },
];

/** Bộ lọc ba khối của trang xuất hồ sơ: thời gian, đại lý, trạng thái. */
function useExportFilters({ solutions = true } = {}) {
  const wardOptions = useOptions(endpoints.resources.wards);
  const agentOptions = useOptions(endpoints.resources.agents);

  return useMemo(
    () => [
      rangeField('from', 'Biên từ', 'Bộ lọc thời gian', {
        groupIcon: 'calendar',
        pair: 'receipt',
        chipLabel: (values) => `Biên từ ${formatDate(values.from)} đến ${formatDate(values.to)}`,
      }),
      rangeField('to', 'Biên đến', 'Bộ lọc thời gian', { pair: 'receipt' }),
      rangeField('reportFrom', 'BC từ', 'Bộ lọc thời gian', {
        pair: 'report',
        chipLabel: (values) =>
          `BC từ ${formatDate(values.reportFrom)} đến ${formatDate(values.reportTo)}`,
      }),
      rangeField('reportTo', 'BC đến', 'Bộ lọc thời gian', { pair: 'report' }),
      {
        name: 'wardName',
        label: 'Phường xã',
        group: 'Bộ lọc đại lý',
        groupIcon: 'home',
        options: wardOptions,
        placeholder: 'Tất cả phường xã',
      },
      {
        name: 'agentName',
        label: 'Đại lý',
        group: 'Bộ lọc đại lý',
        options: agentOptions,
        placeholder: 'Tất cả đại lý',
      },
      {
        name: 'status',
        label: 'Trạng thái',
        group: 'Bộ lọc trạng thái',
        groupIcon: 'flag',
        options: STATUS_OPTIONS,
        placeholder: 'Chọn một tuỳ chọn',
      },
      ...(solutions
        ? [
            {
              name: 'solution',
              label: 'Giải pháp đóng',
              group: 'Bộ lọc trạng thái',
              options: SOLUTION_OPTIONS,
              placeholder: 'Chọn một tuỳ chọn',
            },
          ]
        : []),
    ],
    [wardOptions, agentOptions, solutions],
  );
}

const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
];

/**
 * Các trường của một dòng hồ sơ D03 (BHYT hộ gia đình), chia hai khối: người
 * tham gia là ai, và hồ sơ đóng thế nào. Một hộ có nhiều người nên khối thứ nhất
 * lặp lại từng dòng, khối thứ hai mới là phần khác nhau giữa các dòng.
 */
const D03_PERSON = 'Thông tin người tham gia';
const D03_PAYMENT = 'Thông tin đóng';

const D03_FIELDS = [
  {
    name: 'householdNo',
    label: 'Mã hộ',
    required: true,
    prefix: '#',
    placeholder: 'VD: 9222771905',
    hint: 'Các dòng cùng mã hộ được gom thành một nhóm khi kết xuất.',
    group: D03_PERSON,
    groupIcon: 'users',
  },
  {
    name: 'insuranceNo',
    label: 'Mã số BHXH',
    required: true,
    placeholder: 'VD: 0123456789',
    group: D03_PERSON,
  },
  { name: 'fullName', label: 'Họ và tên', required: true, group: D03_PERSON },
  { name: 'birthDate', label: 'Ngày sinh', type: 'date', required: true, group: D03_PERSON },
  {
    name: 'gender',
    label: 'Giới tính',
    options: GENDER_OPTIONS,
    placeholder: 'Chọn giới tính',
    group: D03_PERSON,
  },
  { name: 'address', label: 'Địa chỉ', colSpan: 2, group: D03_PERSON },
  { name: 'receiptNo', label: 'Số biên lai', group: D03_PAYMENT, groupIcon: 'receipt' },
  {
    name: 'rate',
    label: 'Tỉ lệ đóng (%)',
    type: 'number',
    min: 0,
    max: 100,
    group: D03_PAYMENT,
  },
  { name: 'validFrom', label: 'Ngày giá trị', type: 'date', group: D03_PAYMENT },
  {
    name: 'amount',
    label: 'Mức đóng',
    type: 'number',
    min: 0,
    step: 1000,
    group: D03_PAYMENT,
  },
  {
    name: 'facilityName',
    label: 'Nơi KCB ban đầu',
    placeholder: 'Chọn cơ sở khám chữa bệnh',
    optionsFrom: { endpoint: endpoints.resources.medicalFacilities },
    clearable: true,
    colSpan: 2,
    group: D03_PAYMENT,
  },
];

/** Người tham gia trong hộ: tên, ngày sinh và giới tính đọc cùng một mạch. */
const personColumns = [
  {
    key: 'fullName',
    header: 'Họ và tên',
    sortable: true,
    render: (row) => <span className="font-medium text-gray-900">{row.fullName}</span>,
  },
  {
    key: 'birthDate',
    header: 'Sinh/GT',
    width: '11rem',
    render: (row) => `${formatDate(row.birthDate)} / ${row.gender ?? '—'}`,
  },
];

/**
 * Nhập D03 — danh sách hồ sơ BHYT hộ gia đình đã tạo.
 *
 * Các nút ở đầu trang là những việc làm theo lô của hệ thống cũ (nhập Excel,
 * nhập hộ mới, cập nhật CCCD…); phần chưa có API thì báo bằng toast để không
 * biến thành nút bấm không phản hồi.
 */
export function D03ImportPage() {
  const toast = useToast();
  const endpoint = endpoints.declarations.d03;

  return (
    <ResourceListPage
      title="Nhập D03"
      breadcrumb={[{ label: 'Nhập D03' }, { label: 'Danh sách' }]}
      description="Danh sách người tham gia BHYT hộ gia đình theo mẫu D03-TS."
      endpoint={endpoint}
      searchPlaceholder="Tìm theo mã hộ, mã số BHXH, họ tên…"
      recordLabel="Nhập D03"
      createLabel="Tạo mới Nhập D03"
      rowLabel={(row) => row.fullName}
      formFields={D03_FIELDS}
      perPage={50}
      emptyTitle="Không có dữ liệu"
      emptyDescription="Chưa có bản ghi nào được tạo."
      actions={
        <>
          <ImportExcelButton
            endpoint={endpoints.declarations.d03Import}
            title="Nhập D03 từ Excel"
          />
          <ImportExcelButton
            endpoint={endpoints.declarations.d03Import}
            label="Nhập CCCD"
            title="Nhập số CCCD từ Excel"
          />
          <ImportExcelButton
            endpoint={endpoints.declarations.d03Import}
            label="Cập nhật TG tham gia"
            title="Cập nhật thời gian tham gia từ Excel"
          />
          <ImportExcelButton
            endpoint={endpoints.declarations.d03Import}
            label="Nhập ngày giá trị"
            title="Nhập ngày giá trị thẻ từ Excel"
          />
        </>
      }
      bulkActions={[
        {
          key: 'transfer',
          label: 'Chuyển sang xuất D03',
          onRun: (ids) => toast.success(`Đã chuyển ${ids.length} hồ sơ sang danh sách xuất.`),
        },
      ]}
      columns={[
        {
          key: 'householdNo',
          header: 'Mã hộ',
          width: '11rem',
          sortable: true,
          render: (row) => <Badge tone="brand">{row.householdNo}</Badge>,
        },
        { key: 'insuranceNo', header: 'Mã BHXH', width: '11rem', sortable: true },
        ...personColumns,
        { key: 'receiptNo', header: 'Biên lai', width: '11rem' },
        {
          key: 'rate',
          header: 'Tỉ lệ/Ngày GT',
          width: '11rem',
          render: (row) => `${row.rate}% / ${formatDate(row.validFrom)}`,
        },
        {
          key: 'amount',
          header: 'Mức đóng',
          align: 'right',
          width: '10rem',
          sortable: true,
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'address', header: 'Địa chỉ' },
        { key: 'facilityName', header: 'Nơi KCBBĐ' },
        statusColumn,
      ]}
    />
  );
}

/**
 * Xuất D03 — hồ sơ gom theo mã hộ, mỗi hộ có dòng tóm tắt tổng tiền.
 *
 * Gom nhóm là điểm khác chính so với trang Nhập: cơ quan BHXH duyệt theo hộ
 * gia đình, nên tổng tiền của từng hộ phải đọc được ngay mà không tự cộng.
 */
export function D03ExportPage() {
  const filterFields = useExportFilters();

  return (
    <ResourceListPage
      title="Xuất D03"
      breadcrumb={[{ label: 'Xuất D03' }, { label: 'Danh sách' }]}
      description="Hồ sơ D03-TS chờ kết xuất, gom theo hộ gia đình."
      endpoint={endpoints.declarations.d03}
      searchPlaceholder="Tìm theo mã hộ, mã số BHXH, họ tên…"
      filterFields={filterFields}
      perPage={100}
      sortBy="householdNo"
      emptyTitle="Không có dữ liệu D03"
      emptyDescription="Chưa có dữ liệu D03 nào phù hợp với bộ lọc hiện tại."
      actions={({ exportParams }) => (
        <ExportButton
          endpoint={endpoints.declarations.d03Export}
          params={exportParams}
          fileBaseName="D03"
          label="Xuất Excel D03 (BHYT)"
          icon="download"
        />
      )}
      groupBy={{
        key: (row) => row.householdNo,
        label: (row) => `Mã hộ: ${row.householdNo}`,
        summary: (rows) => (
          <span className="flex justify-between">
            <span>Tóm tắt {rows[0].householdNo}</span>
            <span className="font-medium text-gray-900">
              Tổng {formatCurrency(rows.reduce((sum, row) => sum + (row.subsidy ?? 0), 0))}
            </span>
          </span>
        ),
      }}
      footerRow={(totals) => ({
        label: `TỔNG CỘNG (${formatNumber(totals.count)} người)`,
        row: { amount: totals.amount, subsidy: totals.subsidy },
      })}
      columns={[
        { key: 'insuranceNo', header: 'Mã BHXH', width: '11rem', sortable: true },
        {
          key: 'householdStatus',
          header: 'Trạng thái hộ',
          width: '10rem',
          // "Nghi ngờ" là hộ cần kiểm tra lại trước khi gửi, nên tô đỏ
          render: (row) =>
            row.householdStatus === 'suspect' ? (
              <span className="font-medium text-red-600">Nghi ngờ</span>
            ) : (
              <span className="text-green-700">Hợp lệ</span>
            ),
        },
        ...personColumns,
        { key: 'receiptNo', header: 'Biên lai', width: '11rem' },
        {
          key: 'rate',
          header: 'Tỉ lệ/Ngày GT',
          width: '11rem',
          render: (row) => `${row.rate}% / ${formatDate(row.validFrom)}`,
        },
        {
          key: 'amount',
          header: 'Mức đóng',
          align: 'right',
          width: '10rem',
          sortable: true,
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'address', header: 'Địa chỉ' },
        { key: 'facilityName', header: 'Nơi KCBBĐ' },
        {
          key: 'subsidy',
          header: 'Trợ cấp',
          align: 'right',
          width: '10rem',
          render: (row) => <Badge tone="brand">{formatCurrency(row.subsidy)}</Badge>,
        },
        statusColumn,
      ]}
    />
  );
}

/** Các trường của hồ sơ điều chỉnh AR. */
const AR_FIELDS = [
  {
    name: 'insuranceNo',
    label: 'Mã số BHXH',
    required: true,
    placeholder: 'VD: 0123456789',
    group: 'Thông tin điều chỉnh',
    groupIcon: 'refresh',
  },
  { name: 'fullName', label: 'Họ và tên', required: true, group: 'Thông tin điều chỉnh' },
  {
    name: 'changeType',
    label: 'Loại điều chỉnh',
    options: ['Tăng mới', 'Giảm', 'Điều chỉnh mức đóng', 'Đổi nơi KCB'].map((value) => ({
      value,
      label: value,
    })),
    placeholder: 'Chọn loại điều chỉnh',
    required: true,
    group: 'Thông tin điều chỉnh',
  },
  {
    name: 'amount',
    label: 'Số tiền',
    type: 'number',
    min: 0,
    step: 1000,
    group: 'Thông tin điều chỉnh',
  },
  {
    name: 'wardName',
    label: 'Phường/xã',
    placeholder: 'Chọn phường/xã',
    optionsFrom: { endpoint: endpoints.resources.wards },
    clearable: true,
    group: 'Thông tin điều chỉnh',
  },
  {
    name: 'agentName',
    label: 'Đại lý',
    placeholder: 'Chọn đại lý',
    optionsFrom: { endpoint: endpoints.resources.agents },
    clearable: true,
    group: 'Thông tin điều chỉnh',
  },
];

/** Cột dùng chung cho hai trang AR: chỉ khác nút hành động ở đầu trang. */
const AR_COLUMNS = [
  { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem', sortable: true },
  { key: 'fullName', header: 'Họ và tên', sortable: true },
  { key: 'changeType', header: 'Loại điều chỉnh', width: '13rem', sortable: true },
  {
    key: 'amount',
    header: 'Số tiền',
    align: 'right',
    width: '11rem',
    sortable: true,
    render: (row) => formatCurrency(row.amount),
  },
  { key: 'wardName', header: 'Phường/xã' },
  { key: 'agentName', header: 'Đại lý' },
  {
    key: 'submittedAt',
    header: 'Ngày kê khai',
    width: '11rem',
    sortable: true,
    render: (row) => formatDate(row.submittedAt),
  },
  statusColumn,
];

/** Nhập AR — hồ sơ điều chỉnh BHYT. */
export function ARImportPage() {
  return (
    <ResourceListPage
      title="Nhập AR"
      breadcrumb={[{ label: 'Nhập AR' }, { label: 'Danh sách' }]}
      description="Dữ liệu điều chỉnh (AR) của hồ sơ BHYT."
      endpoint={endpoints.declarations.ar}
      searchPlaceholder="Tìm theo mã số BHXH, họ tên…"
      recordLabel="Nhập AR"
      createLabel="Tạo mới Nhập AR"
      rowLabel={(row) => row.fullName}
      formFields={AR_FIELDS}
      perPage={50}
      emptyTitle="Không có dữ liệu"
      emptyDescription="Chưa có bản ghi nào được tạo."
      actions={
        <ImportExcelButton
          endpoint={endpoints.declarations.arImport}
          title="Nhập AR từ Excel"
        />
      }
      columns={AR_COLUMNS}
    />
  );
}

/** Xuất AR — hồ sơ điều chỉnh chờ kết xuất. */
export function ARExportPage() {
  const filterFields = useExportFilters({ solutions: false });

  return (
    <ResourceListPage
      title="Xuất AR"
      breadcrumb={[{ label: 'Xuất AR' }, { label: 'Danh sách' }]}
      description="Hồ sơ điều chỉnh AR chờ kết xuất."
      endpoint={endpoints.declarations.ar}
      searchPlaceholder="Tìm theo mã số BHXH, họ tên…"
      filterFields={filterFields}
      perPage={100}
      // Bảng rộng phải cuộn ngang mới thấy tiêu đề cột cần bấm, nên đặt sẵn cặp
      // ô chọn "Sắp xếp theo / Tăng dần" cạnh ô tìm kiếm như hệ thống cũ
      sortOptions={[
        { value: 'insuranceNo', label: 'Mã số BHXH' },
        { value: 'fullName', label: 'Họ và tên' },
        { value: 'changeType', label: 'Loại điều chỉnh' },
        { value: 'amount', label: 'Số tiền' },
        { value: 'submittedAt', label: 'Ngày kê khai' },
      ]}
      emptyTitle="Không có dữ liệu AR"
      emptyDescription="Chưa có dữ liệu AR nào phù hợp với bộ lọc hiện tại."
      actions={({ exportParams }) => (
        <ExportButton
          endpoint={endpoints.declarations.arExport}
          params={exportParams}
          fileBaseName="AR"
          label="Xuất Excel AR (BHYT)"
          icon="download"
        />
      )}
      footerRow={(totals) => ({
        label: `TỔNG CỘNG (${formatNumber(totals.count)} bản ghi)`,
        row: { amount: totals.amount },
      })}
      columns={AR_COLUMNS}
    />
  );
}

/** Các trường của hồ sơ D05 (BHXH tự nguyện). */
const D05_FIELDS = [
  {
    name: 'fullName',
    label: 'Họ và tên',
    required: true,
    group: 'Thông tin người tham gia',
    groupIcon: 'user',
  },
  {
    name: 'idNo',
    label: 'CCCD/CMND',
    required: true,
    placeholder: 'VD: 092081012936',
    group: 'Thông tin người tham gia',
  },
  {
    name: 'insuranceNo',
    label: 'Mã số BHXH',
    hint: 'Để trống nếu người này chưa có mã.',
    group: 'Thông tin người tham gia',
  },
  {
    name: 'birthDate',
    label: 'Ngày sinh',
    type: 'date',
    required: true,
    group: 'Thông tin người tham gia',
  },
  {
    name: 'provinceName',
    label: 'Tỉnh/thành phố (mới)',
    placeholder: 'Chọn tỉnh/thành phố',
    optionsFrom: { endpoint: endpoints.resources.provinces },
    clearable: true,
    hint: 'Chọn tỉnh/thành phố trước.',
    group: 'Thông tin người tham gia',
  },
  {
    name: 'wardName',
    label: 'Phường/xã (mới)',
    placeholder: 'Chọn phường/xã',
    optionsFrom: { endpoint: endpoints.resources.wards, dependsOn: 'provinceName' },
    clearable: true,
    group: 'Thông tin người tham gia',
  },
  {
    name: 'salaryBase',
    label: 'Mức lương làm căn cứ',
    type: 'number',
    min: 0,
    step: 100000,
    hint: 'Đơn vị đồng, dùng để tính mức đóng BHXH tự nguyện.',
    group: 'Thông tin người tham gia',
  },
];

/**
 * Nhập D05 — danh sách người chưa tham gia BHXH tự nguyện.
 *
 * "Tham gia D05" là hành động chính của trang: đưa một người vào hồ sơ kê khai.
 * Đặt trong menu Thao tác cùng "Xem quá trình" để bảng không quá rộng.
 */
export function D05ImportPage() {
  const toast = useToast();

  return (
    <ResourceListPage
      title="Nhập D05"
      breadcrumb={[{ label: 'Nhập D05' }, { label: 'Danh sách' }]}
      description="Danh sách người tham gia BHXH tự nguyện theo mẫu D05-TS."
      endpoint={endpoints.declarations.d05}
      searchPlaceholder="Tìm theo mã số BHXH, CCCD, họ tên…"
      recordLabel="Nhập D05"
      createLabel="Tạo mới Nhập D05"
      rowLabel={(row) => row.fullName}
      formFields={D05_FIELDS}
      perPage={100}
      emptyTitle="Không có dữ liệu"
      emptyDescription="Chưa có bản ghi nào được tạo."
      actions={
        <ImportExcelButton
          endpoint={endpoints.declarations.d05Import}
          title="Nhập D05 từ Excel"
        />
      }
      rowActions={[
        {
          key: 'history',
          label: 'Xem quá trình',
          icon: 'eye',
          onRun: (row) => toast.info(`Đang mở quá trình tham gia của ${row.fullName}.`),
        },
        {
          key: 'join',
          label: 'Tham gia D05',
          icon: 'plus',
          onRun: (row) => toast.success(`Đã thêm ${row.fullName} vào hồ sơ D05.`),
        },
        { key: 'edit', label: 'Chỉnh sửa', icon: 'pencil' },
        { key: 'delete', label: 'Xoá', icon: 'trash', tone: 'danger' },
      ]}
      columns={[
        {
          key: 'insuranceNo',
          header: 'Mã BHXH',
          width: '11rem',
          sortable: true,
          // Người chưa có mã số vẫn phải kê khai được, nên nói rõ thay vì để trống
          render: (row) =>
            row.insuranceNo ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="shield" className="h-3.5 w-3.5 text-brand-500" />
                {row.insuranceNo}
              </span>
            ) : (
              <span className="text-gray-400">Chưa có mã</span>
            ),
        },
        { key: 'fullName', header: 'Họ và tên', sortable: true },
        { key: 'idNo', header: 'CCCD/CMND', width: '12rem', sortable: true },
        {
          key: 'birthDate',
          header: 'Ngày sinh',
          width: '10rem',
          sortable: true,
          render: (row) => formatDate(row.birthDate),
        },
        {
          key: 'lastJoinedAt',
          header: 'Tham gia gần nhất',
          width: '13rem',
          /*
           * Ngày tham gia gần nhất kèm số tháng của kỳ đó — hai thông tin luôn
           * đọc cùng nhau khi quyết định có kê khai tiếp hay không, nên gộp vào
           * một nhãn. Người chưa từng tham gia thì nói rõ thay vì để trống.
           */
          render: (row) =>
            row.lastJoinedAt ? (
              <Badge tone="green">
                {formatDate(row.lastJoinedAt)} - {row.lastJoinedMonths} tháng
              </Badge>
            ) : (
              <Badge tone="gray">Chưa tham gia</Badge>
            ),
        },
        { key: 'wardName', header: 'Phường/Xã (Mới)' },
        { key: 'provinceName', header: 'Tỉnh/Thành phố (Mới)' },
      ]}
    />
  );
}

/**
 * Xuất D05 — hồ sơ BHXH tự nguyện chờ kết xuất.
 *
 * Bảng theo hệ thống cũ: mỗi ô ghép hai số liệu đi liền nhau (số tháng với mức
 * lương, tổng tiền với phần hỗ trợ, lãi với tỉ lệ) vì bảng đã hơn mười cột.
 *
 * Sửa được từng dòng nhưng không tạo mới và không xoá: hồ sơ đến từ trang Nhập
 * D05 hoặc tệp Excel, ở đây chỉ chỉnh lại trước khi kết xuất.
 */
export function D05ExportPage() {
  const filterFields = useExportFilters();

  return (
    <ResourceListPage
      title="Xuất D05"
      breadcrumb={[{ label: 'Xuất D05' }, { label: 'Danh sách' }]}
      description="Hồ sơ D05-TS chờ kết xuất gửi cơ quan BHXH."
      endpoint={endpoints.declarations.d05}
      searchPlaceholder="Tìm theo mã số BHXH, CCCD, họ tên…"
      filterFields={filterFields}
      perPage={100}
      formFields={D05_FIELDS}
      creatable={false}
      deletable={false}
      recordLabel="hồ sơ D05"
      rowLabel={(row) => row.fullName}
      sortOptions={[
        { value: 'fullName', label: 'Họ và tên' },
        { value: 'receiptDate', label: 'Ngày biên' },
        { value: 'amount', label: 'Tổng tiền nộp' },
        { value: 'months', label: 'Số tháng' },
      ]}
      emptyTitle="Không có dữ liệu D05"
      emptyDescription="Chưa có dữ liệu D05 nào phù hợp với bộ lọc hiện tại."
      actions={({ exportParams }) => (
        <ExportButton
          endpoint={endpoints.declarations.d05Export}
          params={exportParams}
          fileBaseName="D05"
          label="Xuất Excel D05 (BHXH)"
          icon="download"
        />
      )}
      footerRow={(totals) => ({
        label: `TỔNG CỘNG (${formatNumber(totals.count)} người)`,
        row: totals,
      })}
      columns={[
        sttColumn,
        {
          key: 'fullName',
          header: 'User',
          sortable: true,
          render: (row) =>
            stacked(
              <span className="font-medium">{row.fullName}</span>,
              row.insuranceNo ?? 'Chưa có mã BHXH',
            ),
        },
        {
          key: 'payMethod',
          header: 'ON/TM',
          align: 'center',
          width: '6rem',
          // Nộp qua cổng trực tuyến (ON) hay nộp tiền mặt tại đại lý (TM)
          render: (row) => (
            <Badge tone={row.payMethod === 'online' ? 'brand' : 'gray'}>
              {row.payMethod === 'online' ? 'ON' : 'TM'}
            </Badge>
          ),
        },
        {
          key: 'insuranceType',
          header: 'Loại',
          align: 'center',
          width: '6rem',
          render: () => <Badge tone="green">D05</Badge>,
        },
        {
          key: 'months',
          header: 'Tháng/Mức',
          align: 'right',
          width: '11rem',
          sortable: true,
          render: (row) => stacked(`${row.months} tháng`, formatCurrency(row.salaryBase)),
          // Cộng số tháng của nhiều người thì vô nghĩa, nên dòng tổng để trống
          renderFooter: () => null,
        },
        {
          key: 'amount',
          header: 'Tổng tiền nộp',
          align: 'right',
          width: '12rem',
          sortable: true,
          render: (row) =>
            stacked(
              <span className="font-medium">{formatCurrency(row.employeeAmount)}</span>,
              `Hỗ trợ ${formatCurrency(row.supportAmount)}`,
            ),
          renderFooter: (totals) => formatCurrency(totals.employeeAmount),
        },
        {
          key: 'interest',
          header: 'Lãi/Tỉ lệ',
          align: 'right',
          width: '10rem',
          // Nộp đúng hạn thì không có lãi — nói rõ thay vì hiện 0 đồng
          render: (row) =>
            row.interest
              ? stacked(
                  <span className="font-medium text-red-600">{formatCurrency(row.interest)}</span>,
                  '3,22%',
                )
              : <span className="text-xs text-gray-400">Không lãi</span>,
          renderFooter: (totals) => (
            <span className="text-red-600">{formatCurrency(totals.interest)}</span>
          ),
        },
        { key: 'address', header: 'Địa chỉ' },
        { key: 'receiptNo', header: 'Biên lai', width: '10rem' },
        statusColumn,
      ]}
    />
  );
}
