import { useMemo } from 'react';
import ResourceListPage from '@/features/resource/ResourceListPage';
import { useOptions } from '@/features/resource/useOptions';
import { STATUS_OPTIONS } from '@/features/resource/status';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Collapsible from '@/components/ui/Collapsible';
import DataTable from '@/components/ui/DataTable';
import ExportButton from '@/components/ui/ExportButton';
import Icon from '@/components/ui/Icon';
import StatCards from '@/components/ui/StatCards';
import { useToast } from '@/components/ui/Toast';
import { endpoints } from '@/lib/endpoints';
import { formatDate, formatNumber } from '@/lib/format';
import { startOfMonthISO, todayISO } from '@/lib/date';
import { useDateMismatch, useReportStats } from './useReportStats';
import { REPORT_COLUMNS, REPORT_SORT_OPTIONS, householdGroup } from './reportColumns';

const SOLUTION_OPTIONS = [
  { value: 'monthly', label: 'Đóng hằng tháng' },
  { value: 'quarterly', label: 'Đóng 3 tháng' },
  { value: 'yearly', label: 'Đóng 12 tháng' },
];

/**
 * Bộ lọc ba khối của trang báo cáo: thời gian, đại lý, trạng thái.
 *
 * Hai cặp ngày khác nhau và đều cần thiết: "biên từ/đến" là ngày ghi trên biên
 * lai (người thu ghi), "duyệt từ/đến" là ngày cơ quan BHXH duyệt. Kỳ báo cáo
 * mặc định là tháng này — kỳ hay xem nhất.
 */
function useReportFilters() {
  const wardOptions = useOptions(endpoints.resources.wards);
  const agentOptions = useOptions(endpoints.resources.agents);

  return useMemo(
    () => [
      {
        name: 'from',
        label: 'Biên từ',
        type: 'date',
        group: 'Bộ lọc thời gian',
        groupIcon: 'calendar',
        defaultValue: startOfMonthISO(),
        pair: 'receipt',
        chipLabel: (values) => `Biên từ ${formatDate(values.from)} đến ${formatDate(values.to)}`,
      },
      {
        name: 'to',
        label: 'Biên đến',
        type: 'date',
        group: 'Bộ lọc thời gian',
        defaultValue: todayISO(),
        pair: 'receipt',
      },
      {
        name: 'approvedFrom',
        label: 'Duyệt từ',
        type: 'date',
        group: 'Bộ lọc thời gian',
        pair: 'approved',
        chipLabel: (values) =>
          `Duyệt từ ${formatDate(values.approvedFrom)} đến ${formatDate(values.approvedTo)}`,
      },
      {
        name: 'approvedTo',
        label: 'Duyệt đến',
        type: 'date',
        group: 'Bộ lọc thời gian',
        pair: 'approved',
      },
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
      {
        name: 'solution',
        label: 'Giải pháp đóng',
        group: 'Bộ lọc trạng thái',
        options: SOLUTION_OPTIONS,
        placeholder: 'Chọn một tuỳ chọn',
      },
    ],
    [wardOptions, agentOptions],
  );
}

/** Năm ô số liệu trên đầu trang, dựng từ `GET /reports/<type>/stats`. */
const statItems = (stats = {}) => [
  {
    key: 'todayPending',
    label: 'Hôm nay chưa duyệt',
    value: formatNumber(stats.todayPending ?? 0),
    hint: 'Hồ sơ lập hôm nay, chờ cơ quan BHXH duyệt',
    tone: 'amber',
    icon: 'clock',
  },
  {
    key: 'todayApproved',
    label: 'Hôm nay đã duyệt',
    value: formatNumber(stats.todayApproved ?? 0),
    hint: 'Đã được cơ quan BHXH tiếp nhận',
    tone: 'green',
    icon: 'check',
  },
  {
    key: 'todayTotal',
    label: 'Tổng đơn hôm nay',
    value: formatNumber(stats.todayTotal ?? 0),
    hint: 'Cả chưa duyệt và đã duyệt',
    tone: 'brand',
    icon: 'document',
  },
  {
    key: 'yesterdayPending',
    label: 'Hôm qua chưa duyệt',
    value: formatNumber(stats.yesterdayPending ?? 0),
    hint: 'Hồ sơ của hôm qua còn tồn',
    tone: 'gray',
    icon: 'calendar',
  },
  {
    key: 'totalPending',
    label: 'Tổng chưa duyệt',
    value: formatNumber(stats.totalPending ?? 0),
    hint: 'Toàn bộ hồ sơ chưa duyệt',
    tone: 'red',
    icon: 'warning',
  },
];

/** Cột của khối "Lệch ngày (Import)" — chỉ đủ để nhận ra hồ sơ cần sửa. */
const MISMATCH_COLUMNS = [
  { key: 'fullName', header: 'Họ và tên' },
  { key: 'insuranceNo', header: 'Mã BHXH', width: '11rem' },
  {
    key: 'receiptDate',
    header: 'Ngày biên lai',
    width: '11rem',
    render: (row) => formatDate(row.receiptDate ?? row.submittedAt),
  },
  {
    key: 'importDate',
    header: 'Ngày trên tệp nhập',
    width: '12rem',
    render: (row) => <span className="font-medium text-red-600">{formatDate(row.importDate)}</span>,
  },
  { key: 'agentName', header: 'Đại lý' },
];

const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
];

/**
 * Các trường sửa được của một dòng báo cáo.
 *
 * Trang báo cáo không tạo hồ sơ mới (hồ sơ đến từ trang nhập hoặc tệp Excel)
 * nhưng vẫn phải sửa được: soát báo cáo là lúc phát hiện sai ngày biên lai, sai
 * giới tính hay thiếu số biên lai. Vì vậy chỉ mở những trường hay phải sửa lại,
 * không mở toàn bộ bản ghi.
 */
const PERSON_GROUP = 'Thông tin người tham gia';
const RECEIPT_GROUP = 'Thông tin biên lai';

const REPORT_FIELDS = [
  { name: 'fullName', label: 'Họ và tên', required: true, group: PERSON_GROUP, groupIcon: 'user' },
  {
    name: 'insuranceNo',
    label: 'Mã số BHXH',
    placeholder: 'VD: 0123456789',
    group: PERSON_GROUP,
  },
  { name: 'idNo', label: 'CCCD/CMND', placeholder: 'VD: 092081012936', group: PERSON_GROUP },
  {
    name: 'gender',
    label: 'Giới tính',
    options: GENDER_OPTIONS,
    placeholder: 'Chọn giới tính',
    group: PERSON_GROUP,
  },
  { name: 'birthDate', label: 'Ngày sinh', type: 'date', group: PERSON_GROUP },
  { name: 'receiptNo', label: 'Số biên lai', group: RECEIPT_GROUP, groupIcon: 'receipt' },
  { name: 'receiptDate', label: 'Ngày biên lai', type: 'date', group: RECEIPT_GROUP },
  {
    name: 'approvedAt',
    label: 'Ngày duyệt',
    type: 'date',
    hint: 'Để trống nếu cơ quan BHXH chưa duyệt.',
    group: RECEIPT_GROUP,
  },
  {
    name: 'agentName',
    label: 'Đại lý',
    placeholder: 'Chọn đại lý',
    optionsFrom: { endpoint: endpoints.resources.agents },
    clearable: true,
    group: RECEIPT_GROUP,
  },
  {
    name: 'status',
    label: 'Trạng thái',
    options: STATUS_OPTIONS,
    placeholder: 'Chọn trạng thái',
    group: RECEIPT_GROUP,
  },
];

/** D05 sửa thêm phần tiền: số tháng và mức lương quyết định số phải nộp. */
const D05_EXTRA_FIELDS = [
  { name: 'months', label: 'Số tháng đóng', type: 'number', min: 1, max: 60, group: RECEIPT_GROUP },
  {
    name: 'salaryBase',
    label: 'Mức lương căn cứ',
    type: 'number',
    min: 0,
    step: 100000,
    group: RECEIPT_GROUP,
  },
];

/** BHYT sửa thêm mức đóng; BHXH tự nguyện suy ra từ mức lương và số tháng. */
const BHYT_EXTRA_FIELDS = [
  { name: 'amount', label: 'Mức đóng', type: 'number', min: 0, step: 1000, group: RECEIPT_GROUP },
];

/** AR còn sửa được loại điều chỉnh — chọn sai loại thì cơ quan BHXH trả hồ sơ. */
const AR_EXTRA_FIELDS = [
  {
    name: 'changeType',
    label: 'Loại điều chỉnh',
    options: ['Tăng mới', 'Giảm', 'Điều chỉnh mức đóng', 'Đổi nơi KCB'].map((value) => ({
      value,
      label: value,
    })),
    placeholder: 'Chọn loại điều chỉnh',
    group: RECEIPT_GROUP,
  },
];

const EXTRA_FIELDS = {
  d03: BHYT_EXTRA_FIELDS,
  ar: [...BHYT_EXTRA_FIELDS, ...AR_EXTRA_FIELDS],
  d05: D05_EXTRA_FIELDS,
};

const formFieldsOf = (type) => [...REPORT_FIELDS, ...(EXTRA_FIELDS[type] ?? BHYT_EXTRA_FIELDS)];

/**
 * Trang báo cáo theo mẫu biểu (D03 / AR / BHYT, D05 / BHXH).
 *
 * Dùng chung `ResourceListPage` với các trang danh sách khác vì bản chất là một
 * danh sách có lọc, phân trang và sắp xếp; ba thứ riêng của báo cáo được truyền
 * vào qua slot: dải ô số liệu (`stats`), khối gập "Lệch ngày" (`panels`) và cặp
 * ô chọn sắp xếp (`sortOptions`).
 *
 * Dữ liệu lấy từ `GET /reports/<type>` — cùng tập hồ sơ với trang nhập/xuất,
 * chỉ khác cách trình bày.
 *
 * @param {{ title: string, description?: string, type: 'd03'|'ar'|'d05' }} props
 */
export default function ReportPage({ title, description, type }) {
  const toast = useToast();
  const filterFields = useReportFilters();
  const { stats, isLoading: statsLoading } = useReportStats(type);
  const mismatch = useDateMismatch(type);
  const formFields = useMemo(() => formFieldsOf(type), [type]);

  const endpoint = endpoints.reports[type];
  // Hồ sơ BHYT đọc theo hộ gia đình; BHXH tự nguyện là từng người một
  const byHousehold = type !== 'd05';

  return (
    <ResourceListPage
      title={title}
      description={description ?? 'Hồ sơ đã kê khai trong kỳ, kèm số liệu duyệt theo ngày.'}
      breadcrumb={[{ label: title }, { label: 'Danh sách' }]}
      endpoint={endpoint}
      searchPlaceholder="Tìm theo mã hộ, mã BHXH, CCCD, họ tên…"
      filterFields={filterFields}
      columns={REPORT_COLUMNS[type]}
      sortOptions={REPORT_SORT_OPTIONS[type]}
      // Gom nhóm chỉ đúng khi các dòng cùng hộ nằm liền nhau
      sortBy={byHousehold ? 'householdNo' : undefined}
      groupBy={byHousehold ? householdGroup : undefined}
      perPage={50}
      // Sửa được nhưng không tạo/xoá: hồ sơ đến từ trang nhập hoặc tệp Excel
      formFields={formFields}
      creatable={false}
      deletable={false}
      recordLabel="hồ sơ"
      rowLabel={(row) => row.fullName}
      emptyTitle="Không có dữ liệu"
      emptyDescription="Chưa có hồ sơ nào trong kỳ báo cáo đang chọn."
      stats={<StatCards items={statItems(stats)} loading={statsLoading} />}
      panels={
        <Collapsible
          title="Lệch ngày (Import)"
          icon="warning"
          badge={
            mismatch.total > 0 ? <Badge tone="red">{formatNumber(mismatch.total)}</Badge> : undefined
          }
        >
          <p className="mb-3 text-xs text-gray-600">
            Hồ sơ có ngày trên tệp nhập từ cổng BHXH khác ngày ghi trên biên lai. Sửa lại trước
            khi kết xuất để cơ quan BHXH không trả hồ sơ.
          </p>
          <div className="-mx-4 -mb-4">
            <DataTable
              columns={MISMATCH_COLUMNS}
              rows={mismatch.rows}
              loading={mismatch.isLoading}
            />
          </div>
        </Collapsible>
      }
      actions={({ exportParams }) => (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('Các tính năng nâng cao sẽ mở khi backend sẵn sàng.')}
          >
            <Icon name="ellipsis" className="h-4 w-4" />
            Xem thêm tính năng
          </Button>
          <Button variant="secondary" size="sm" to="/receipts">
            <Icon name="receipt" className="h-4 w-4" />
            Bản kê biên lai
          </Button>
          <ExportButton
            endpoint={endpoints.reports.export(type)}
            params={exportParams}
            fileBaseName={`BaoCao_${type.toUpperCase()}`}
            label="Xuất báo cáo"
            variant="secondary"
            icon="download"
          />
          <ExportButton
            endpoint={endpoints.reports.statistics(type)}
            params={exportParams}
            fileBaseName={`ThongKe_${type.toUpperCase()}`}
            label="Xuất thống kê"
            icon="chart"
          />
        </>
      )}
      rowActions={[
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: 'eye',
          onRun: (row) => toast.info(`Đang mở hồ sơ của ${row.fullName}.`),
        },
        { key: 'edit', label: 'Chỉnh sửa', icon: 'pencil' },
        {
          key: 'append',
          label: 'Tham gia bổ sung',
          icon: 'plus',
          onRun: (row) =>
            toast.success(`Đã tạo hồ sơ tham gia bổ sung cho ${row.fullName}.`),
        },
      ]}
      footerRow={(totals) => ({
        label: `TỔNG CỘNG (${formatNumber(totals.count)} người)`,
        row: totals,
      })}
    />
  );
}
