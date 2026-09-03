import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import DataTable from '@/components/ui/DataTable';
import ExportButton from '@/components/ui/ExportButton';
import FilterBar from '@/components/ui/FilterBar';
import { useOptions } from '@/features/resource/useOptions';
import { useResourceFilters } from '@/features/resource/useResourceFilters';
import { STATUS_OPTIONS } from '@/features/resource/status';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatNumber } from '@/lib/format';
import { endOfMonthISO, startOfMonthISO } from '@/lib/date';

const FORM_OPTIONS = [
  { value: 'monthly', label: 'Đóng hằng tháng' },
  { value: 'quarterly', label: 'Đóng 3 tháng' },
  { value: 'yearly', label: 'Đóng 12 tháng' },
];

/**
 * Cột "số thẻ / số tiền" của một kỳ đóng: hệ thống cũ xếp hai số này chồng lên
 * nhau trong cùng một ô, đọc theo cột dễ so sánh hơn là tách thành hai cột.
 */
const periodColumn = (label, countKey, amountKey) => ({
  key: countKey,
  header: label,
  align: 'right',
  width: '9rem',
  render: (row) => (
    <span className="block leading-tight">
      <span className="block font-medium text-gray-900">{formatNumber(row[countKey] ?? 0)}</span>
      <span className="block text-xs text-gray-500">{formatNumber(row[amountKey] ?? 0)}</span>
    </span>
  ),
});

/** Cột tiền dùng chung cho doanh thu / đã nộp / chênh lệch. */
const moneyColumn = (key, header, tone) => ({
  key,
  header,
  align: 'right',
  width: '11rem',
  render: (row) => <span className={tone?.(row)}>{formatCurrency(row[key])}</span>,
});

/** Cột của cả hai bảng D03 và D05 — cùng cấu trúc, chỉ khác dữ liệu. */
const COLUMNS = [
  { key: 'collaboratorName', header: 'Cộng tác viên' },
  { key: 'employeeCode', header: 'Mã NV', width: '9rem' },
  {
    key: 'total',
    header: 'Tổng số',
    align: 'right',
    width: '8rem',
    render: (row) => formatNumber(row.total),
  },
  periodColumn('1 tháng', 'months1', 'months1Amount'),
  periodColumn('3 tháng', 'months3', 'months3Amount'),
  periodColumn('6 tháng', 'months6', 'months6Amount'),
  periodColumn('12 tháng', 'months12', 'months12Amount'),
  moneyColumn('revenue', 'Doanh thu'),
  moneyColumn('paid', 'Số tiền đã nộp'),
  // Chênh lệch âm nghĩa là còn phải nộp — tô đỏ để thấy ngay dòng nào chưa xong
  moneyColumn('diff', 'Chênh lệch', (row) =>
    row.diff < 0 ? 'font-medium text-red-600' : 'font-medium text-green-700',
  ),
];

/**
 * Báo cáo tổng hợp số thu theo cộng tác viên.
 *
 * Hai bảng (D03 - BHYT và D05 - BHXH) dùng chung một bộ lọc, và bộ lọc phải bấm
 * "Áp dụng" mới chạy: mỗi lần truy vấn phải quét toàn bộ biên lai trong kỳ nên
 * không thể gọi lại sau từng lần đổi một ô.
 */
export default function SummaryReportPage() {
  const wardOptions = useOptions(endpoints.resources.wards);

  const filterFields = useMemo(
    () => [
      {
        name: 'wardName',
        label: 'Phường xã',
        options: wardOptions,
        placeholder: 'Tất cả',
      },
      {
        name: 'from',
        label: 'Từ ngày',
        type: 'date',
        required: true,
        defaultValue: startOfMonthISO(),
        pair: 'range',
        chipLabel: (values) => `Từ ${values.from} đến ${values.to}`,
      },
      {
        name: 'to',
        label: 'Đến ngày',
        type: 'date',
        required: true,
        defaultValue: endOfMonthISO(),
        pair: 'range',
      },
      { name: 'form', label: 'Hình thức', options: FORM_OPTIONS, placeholder: 'Tất cả' },
      { name: 'status', label: 'Trạng thái duyệt', options: STATUS_OPTIONS, placeholder: 'Tất cả' },
    ],
    [wardOptions],
  );

  const filterState = useResourceFilters(filterFields, { defer: true });
  const endpoint = endpoints.reports.summary;

  const { data, isFetching, error } = useQuery({
    queryKey: [endpoint, filterState.params],
    queryFn: () => http.get(endpoint, { params: filterState.params }),
  });

  return (
    <>
      <Breadcrumb items={[{ label: 'Báo Cáo Tổng Hợp' }, { label: 'Báo cáo tổng hợp' }]} />

      <PageHeader
        title="Báo cáo tổng hợp"
        description="Tổng hợp số thẻ và số thu theo cộng tác viên trong kỳ."
        actions={
          <>
            <ExportButton
              endpoint={endpoints.reports.summaryExport}
              params={{ ...filterState.params, sheet: 'd03' }}
              fileBaseName="BaoCaoTongHop_D03"
              label="Xuất Excel D03 (BHYT)"
              icon="download"
            />
            <ExportButton
              endpoint={endpoints.reports.summaryExport}
              params={{ ...filterState.params, sheet: 'd05' }}
              fileBaseName="BaoCaoTongHop_D05"
              label="Xuất Excel D05 (BHXH)"
              icon="download"
            />
          </>
        }
      />

      {error && (
        <Alert className="mb-4" title="Không tải được báo cáo">
          {error.message}
        </Alert>
      )}

      <Card className="mb-4" bodyClassName="p-0">
        <FilterBar
          fields={filterFields}
          values={filterState.values}
          onChange={filterState.setValue}
          chips={filterState.chips}
          onClearChip={filterState.clearNames}
          onReset={filterState.reset}
          onApply={filterState.apply}
          columns={5}
        />
      </Card>

      <div className="space-y-4">
        <ReportTable
          title="Báo cáo D03 (BHYT) - Bảo hiểm y tế"
          section={data?.d03}
          loading={isFetching}
        />
        <ReportTable
          title="Báo cáo D05 (BHXH) - Bảo hiểm xã hội"
          section={data?.d05}
          loading={isFetching}
        />
      </div>
    </>
  );
}

/** Một bảng báo cáo kèm dòng TỔNG CỘNG do server tính trên cả kỳ. */
function ReportTable({ title, section, loading }) {
  return (
    <Card title={title} bodyClassName="p-0">
      <DataTable
        columns={COLUMNS}
        rows={section?.data ?? []}
        // Báo cáo không có id: mỗi dòng là một cộng tác viên, đó chính là khoá
        rowKey={(row) => `${row.collaboratorName}-${row.employeeCode}`}
        loading={loading}
        footer={section?.totals ? { label: 'TỔNG CỘNG', row: section.totals } : undefined}
      />
    </Card>
  );
}
