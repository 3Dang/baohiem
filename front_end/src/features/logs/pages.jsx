import ResourceListPage from '@/features/resource/ResourceListPage';
import Badge from '@/components/ui/Badge';
import { endpoints } from '@/lib/endpoints';
import { formatDateTime } from '@/lib/format';

/** Màu theo mức độ log, giúp nhận ra lỗi nghiêm trọng khi cuộn nhanh. */
const LEVEL_TONES = { error: 'red', warning: 'amber', info: 'brand', debug: 'gray' };

/** Log kỹ thuật của ứng dụng (exception, job thất bại…). */
export function SystemLogsPage() {
  return (
    <ResourceListPage
      title="System logs"
      description="Log kỹ thuật phục vụ chẩn đoán sự cố."
      endpoint={endpoints.resources.systemLogs}
      searchPlaceholder="Tìm theo nội dung log…"
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

/** Vết thao tác của người dùng trên dữ liệu nghiệp vụ. */
export function AuditLogsPage() {
  return (
    <ResourceListPage
      title="Audit logs"
      description="Lịch sử thao tác của người dùng trên dữ liệu nghiệp vụ."
      endpoint={endpoints.resources.auditLogs}
      searchPlaceholder="Tìm theo người dùng, đối tượng…"
      columns={[
        { key: 'actor', header: 'Người thực hiện', width: '14rem' },
        { key: 'action', header: 'Hành động', width: '10rem' },
        { key: 'subject', header: 'Đối tượng' },
        { key: 'ip', header: 'IP', width: '10rem' },
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
