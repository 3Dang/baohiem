import { useMemo } from 'react';
import ResourceListPage from '@/features/resource/ResourceListPage';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { endpoints } from '@/lib/endpoints';
import { formatDate, formatDateTime } from '@/lib/format';
import { endOfMonthISO, startOfMonthISO } from '@/lib/date';

/** Màu theo mức độ log, giúp nhận ra lỗi nghiêm trọng khi cuộn nhanh. */
const LEVEL_TONES = { error: 'red', warning: 'amber', info: 'brand', debug: 'gray' };

/** Khoảng thời gian dùng chung cho cả hai loại log. */
const LOG_DATE_FIELDS = [
  {
    name: 'from',
    label: 'Từ ngày',
    type: 'date',
    defaultValue: startOfMonthISO(),
    pair: 'range',
    chipLabel: (values) => `Từ ${formatDate(values.from)} đến ${formatDate(values.to)}`,
  },
  { name: 'to', label: 'Đến ngày', type: 'date', defaultValue: endOfMonthISO(), pair: 'range' },
];

/** Log kỹ thuật của ứng dụng (exception, job thất bại…). */
export function SystemLogsPage() {
  const filterFields = useMemo(
    () => [
      ...LOG_DATE_FIELDS,
      {
        name: 'level',
        label: 'Mức độ',
        options: Object.keys(LEVEL_TONES).map((value) => ({ value, label: value })),
        placeholder: 'Tất cả',
      },
    ],
    [],
  );

  return (
    <ResourceListPage
      title="System logs"
      breadcrumb={[{ label: 'System Logs' }, { label: 'Danh sách' }]}
      description="Log kỹ thuật phục vụ chẩn đoán sự cố."
      endpoint={endpoints.resources.systemLogs}
      searchPlaceholder="Tìm theo nội dung log…"
      filterFields={filterFields}
      filterColumns={3}
      emptyDescription="Không có log nào trong khoảng thời gian đang lọc."
      columns={[
        {
          key: 'level',
          header: 'Mức',
          width: '7rem',
          render: (row) => <Badge tone={LEVEL_TONES[row.level] ?? 'gray'}>{row.level}</Badge>,
        },
        { key: 'message', header: 'Nội dung' },
        { key: 'context', header: 'Nguồn', width: '12rem' },
        {
          key: 'createdAt',
          header: 'Thời điểm',
          width: '12rem',
          render: (row) => formatDateTime(row.createdAt),
        },
      ]}
    />
  );
}

/**
 * Hành động ghi vết. Xoá tô đỏ vì đó là thao tác duy nhất phải xem lại ngay;
 * tạo mới và cập nhật là việc thường ngày nên để màu dịu.
 */
const ACTIONS = {
  create: { label: 'Tạo mới', tone: 'green' },
  update: { label: 'Cập nhật', tone: 'brand' },
  delete: { label: 'Xoá', tone: 'red' },
};

const ACTION_OPTIONS = Object.entries(ACTIONS).map(([value, { label }]) => ({ value, label }));

/** Bảng dữ liệu có ghi vết — lọc theo bảng để soát một nghiệp vụ cụ thể. */
const TABLE_OPTIONS = [
  { value: 'insurance_receipts', label: 'Biên lai bảo hiểm' },
  { value: 'declarations', label: 'Hồ sơ kê khai' },
  { value: 'payments', label: 'Phiếu nộp tiền' },
  { value: 'agents', label: 'Đại lý' },
  { value: 'receipt_books', label: 'Quyển biên lai' },
  { value: 'settings', label: 'Cài đặt' },
];

const TABLE_LABELS = Object.fromEntries(
  TABLE_OPTIONS.map(({ value, label }) => [value, label]),
);

/**
 * Vết thao tác của người dùng trên dữ liệu nghiệp vụ.
 *
 * Ghi theo bảng + id bản ghi (chứ không phải một câu mô tả) vì đây là dữ liệu để
 * đối chiếu: biết bảng nào, dòng nào đã đổi thì mới khôi phục lại được. Cột CCCD
 * cho phép tra thẳng theo người tham gia mà không phải mở từng bản ghi.
 *
 * Chỉ đọc: bản ghi ghi vết không được sửa hay tạo tay, nên trang không khai
 * `formFields`. "Khôi phục" là ghi lại giá trị cũ vào bảng gốc — một nghiệp vụ
 * riêng, chưa có API nên báo bằng toast.
 *
 * `perPage` 10 vì bảng này rất dài (hơn 380 nghìn dòng) và người dùng thường
 * chỉ soát vài dòng gần nhất sau khi lọc.
 */
export function AuditLogsPage() {
  const toast = useToast();

  const filterFields = useMemo(
    () => [
      ...LOG_DATE_FIELDS,
      { name: 'tableName', label: 'Bảng dữ liệu', options: TABLE_OPTIONS, placeholder: 'Tất cả' },
      { name: 'action', label: 'Hành động', options: ACTION_OPTIONS, placeholder: 'Tất cả' },
    ],
    [],
  );

  return (
    <ResourceListPage
      title="Audit logs"
      breadcrumb={[{ label: 'Audit Logs' }, { label: 'Danh sách' }]}
      description="Lịch sử thao tác của người dùng trên dữ liệu nghiệp vụ."
      endpoint={endpoints.resources.auditLogs}
      searchPlaceholder="Tìm theo người dùng, CCCD, id bản ghi…"
      filterFields={filterFields}
      filterColumns={4}
      perPage={10}
      emptyDescription="Không có thao tác nào trong khoảng thời gian đang lọc."
      rowActions={[
        {
          key: 'view',
          label: 'Xem',
          icon: 'eye',
          onRun: (row) => toast.info(`Đang mở bản ghi #${row.recordId} của bảng ${row.tableName}.`),
        },
        {
          key: 'detail',
          label: 'Chi tiết',
          icon: 'document',
          onRun: (row) => toast.info(`Chi tiết thay đổi của vết #${row.id}.`),
        },
        {
          key: 'restore',
          label: 'Khôi phục',
          icon: 'refresh',
          onRun: (row) =>
            toast.success(`Đã khôi phục bản ghi #${row.recordId} về giá trị trước thao tác.`),
        },
      ]}
      columns={[
        {
          key: 'id',
          header: 'ID',
          align: 'right',
          width: '6rem',
          sortable: true,
          render: (row) => <span className="font-mono text-xs text-gray-500">{row.id}</span>,
        },
        { key: 'actor', header: 'Người dùng', width: '14rem', sortable: true },
        {
          key: 'tableName',
          header: 'Bảng',
          width: '12rem',
          sortable: true,
          render: (row) => (
            <Badge tone="gray">{TABLE_LABELS[row.tableName] ?? row.tableName}</Badge>
          ),
        },
        {
          key: 'recordId',
          header: 'ID bản ghi',
          align: 'right',
          width: '8rem',
          sortable: true,
          render: (row) => <span className="font-mono text-xs text-brand-800">{row.recordId}</span>,
        },
        { key: 'idNo', header: 'CCCD', width: '12rem', sortable: true },
        {
          key: 'action',
          header: 'Hành động',
          width: '9rem',
          sortable: true,
          render: (row) => {
            const config = ACTIONS[row.action];
            return <Badge tone={config?.tone ?? 'gray'}>{config?.label ?? row.action}</Badge>;
          },
        },
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
