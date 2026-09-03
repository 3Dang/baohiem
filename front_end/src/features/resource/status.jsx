import Badge from '@/components/ui/Badge';

/** Nhãn màu theo trạng thái xử lý chung của các nghiệp vụ thu/nộp/kê khai. */
export const STATUS_TONES = {
  draft: { tone: 'gray', label: 'Nháp' },
  pending: { tone: 'amber', label: 'Chờ chuyển' },
  approved: { tone: 'green', label: 'Đã duyệt' },
  rejected: { tone: 'red', label: 'Từ chối' },
};

export function StatusBadge({ status }) {
  const config = STATUS_TONES[status] ?? { tone: 'gray', label: status ?? '—' };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

/** Tuỳ chọn trạng thái dùng lại cho mọi bộ lọc — cùng nhãn với cột Trạng thái. */
export const STATUS_OPTIONS = Object.entries(STATUS_TONES).map(([value, { label }]) => ({
  value,
  label,
}));

/** Cột Trạng thái tiêu chuẩn, dùng chung cho mọi bảng nghiệp vụ. */
export const statusColumn = {
  key: 'status',
  header: 'Trạng thái',
  width: '9rem',
  sortable: true,
  render: (row) => <StatusBadge status={row.status} />,
};
