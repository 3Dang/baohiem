import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import { TextField } from '@/components/ui/Field';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

/** Mặc định lấy tháng hiện tại — kỳ báo cáo hay dùng nhất. */
function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const iso = (date) => date.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(now) };
}

/** Cột báo cáo theo từng loại hồ sơ. */
const REPORT_COLUMNS = {
  d03: [
    { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem' },
    { key: 'fullName', header: 'Người tham gia' },
    { key: 'wardName', header: 'Phường/xã' },
    { key: 'months', header: 'Số tháng', align: 'right', width: '7rem' },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'submittedAt', header: 'Ngày kê khai', render: (row) => formatDate(row.submittedAt) },
  ],
  ar: [
    { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem' },
    { key: 'fullName', header: 'Người tham gia' },
    { key: 'changeType', header: 'Loại điều chỉnh' },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'submittedAt', header: 'Ngày kê khai', render: (row) => formatDate(row.submittedAt) },
  ],
  d05: [
    { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem' },
    { key: 'fullName', header: 'Người tham gia' },
    { key: 'salaryBase', header: 'Mức lương', align: 'right', render: (row) => formatCurrency(row.salaryBase) },
    { key: 'months', header: 'Số tháng', align: 'right', width: '7rem' },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'submittedAt', header: 'Ngày kê khai', render: (row) => formatDate(row.submittedAt) },
  ],
  summary: [
    { key: 'agentName', header: 'Đại lý' },
    { key: 'participants', header: 'Số người', align: 'right', render: (row) => formatNumber(row.participants) },
    { key: 'receipts', header: 'Số biên lai', align: 'right', render: (row) => formatNumber(row.receipts) },
    {
      key: 'amount',
      header: 'Tổng thu',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
    },
  ],
};

/**
 * Trang báo cáo theo khoảng thời gian.
 *
 * GET /reports/:type?from=&to= → `{ data: [...], totals: { amount, count } }`
 * Người dùng phải bấm "Xem báo cáo" mới truy vấn, tránh query nặng khi vừa mở trang.
 */
export default function ReportPage({ title, description, type }) {
  const [range, setRange] = useState(currentMonthRange);
  // `applied` là khoảng thời gian đã xác nhận — chỉ nó tham gia queryKey
  const [applied, setApplied] = useState(null);

  const endpoint = endpoints.reports[type];
  const columns = REPORT_COLUMNS[type];

  const { data, isFetching, error } = useQuery({
    queryKey: [endpoint, applied],
    queryFn: () => http.get(endpoint, { params: applied }),
    enabled: Boolean(applied),
  });

  const submit = (event) => {
    event.preventDefault();
    setApplied(range);
  };

  const update = (name) => (event) =>
    setRange((prev) => ({ ...prev, [name]: event.target.value }));

  return (
    <>
      <PageHeader title={title} description={description} />

      {error && (
        <Alert className="mb-4" title="Không tải được báo cáo">
          {error.message}
        </Alert>
      )}

      <Card className="mb-4" title="Kỳ báo cáo">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
          <TextField
            name="from"
            type="date"
            label="Từ ngày"
            required
            value={range.from}
            onChange={update('from')}
          />
          <TextField
            name="to"
            type="date"
            label="Đến ngày"
            required
            min={range.from || undefined}
            value={range.to}
            onChange={update('to')}
          />
          <Button type="submit" loading={isFetching}>
            <Icon name="chart" className="h-4 w-4" />
            Xem báo cáo
          </Button>
        </form>
      </Card>

      <Card
        title="Kết quả"
        description={
          data?.totals &&
          `${formatNumber(data.totals.count)} bản ghi · Tổng ${formatCurrency(data.totals.amount)}`
        }
        bodyClassName="p-0"
      >
        {applied ? (
          <DataTable columns={columns} rows={data?.data ?? []} loading={isFetching} />
        ) : (
          <EmptyState
            icon="chart"
            title="Chọn kỳ báo cáo"
            description="Chọn khoảng thời gian rồi bấm “Xem báo cáo” để truy vấn dữ liệu."
          />
        )}
      </Card>
    </>
  );
}
