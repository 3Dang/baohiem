import ResourceListPage from '@/features/resource/ResourceListPage';
import Badge from '@/components/ui/Badge';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

/** Nhãn màu theo trạng thái xử lý chung của các nghiệp vụ thu/nộp. */
const STATUS_TONES = {
  draft: { tone: 'gray', label: 'Nháp' },
  pending: { tone: 'amber', label: 'Chờ xử lý' },
  approved: { tone: 'green', label: 'Đã duyệt' },
  rejected: { tone: 'red', label: 'Từ chối' },
};

function StatusBadge({ status }) {
  const config = STATUS_TONES[status] ?? { tone: 'gray', label: status ?? '—' };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

/** Mức lương cơ sở theo từng giai đoạn — căn cứ tính mức đóng. */
export function BaseSalaryPage() {
  return (
    <ResourceListPage
      title="Base salary"
      description="Mức lương cơ sở áp dụng theo từng giai đoạn."
      endpoint={endpoints.resources.baseSalary}
      searchPlaceholder="Tìm theo giai đoạn…"
      columns={[
        {
          key: 'amount',
          header: 'Mức lương',
          align: 'right',
          width: '12rem',
          render: (row) => formatCurrency(row.amount),
        },
        {
          key: 'effectiveFrom',
          header: 'Hiệu lực từ',
          render: (row) => formatDate(row.effectiveFrom),
        },
        {
          key: 'effectiveTo',
          header: 'Hiệu lực đến',
          render: (row) => formatDate(row.effectiveTo),
        },
        { key: 'note', header: 'Ghi chú' },
      ]}
    />
  );
}

/** Biên lai bảo hiểm đã phát hành. */
export function InsuranceReceiptsPage() {
  return (
    <ResourceListPage
      title="Biên lai bảo hiểm"
      endpoint={endpoints.resources.insuranceReceipts}
      searchPlaceholder="Tìm theo số biên lai, mã số BHXH…"
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem' },
        { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem' },
        { key: 'fullName', header: 'Người tham gia' },
        {
          key: 'amount',
          header: 'Số tiền',
          align: 'right',
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'issuedAt', header: 'Ngày phát hành', render: (row) => formatDate(row.issuedAt) },
        { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}

/** Phiếu nộp tiền của đại lý về cơ quan BHXH. */
export function PaymentsPage() {
  return (
    <ResourceListPage
      title="Quản lý nộp tiền"
      description="Phiếu nộp tiền của đại lý thu."
      endpoint={endpoints.resources.payments}
      searchPlaceholder="Tìm theo số phiếu, đại lý…"
      columns={[
        { key: 'code', header: 'Số phiếu', width: '10rem' },
        { key: 'agentName', header: 'Đại lý' },
        {
          key: 'amount',
          header: 'Số tiền',
          align: 'right',
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'paidAt', header: 'Ngày nộp', render: (row) => formatDate(row.paidAt) },
        { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}

/** Biên lai thu tiền (bản giấy). */
export function ReceiptsPage() {
  return (
    <ResourceListPage
      title="Biên lai"
      endpoint={endpoints.resources.receipts}
      searchPlaceholder="Tìm theo số biên lai, người tham gia…"
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem' },
        { key: 'bookNo', header: 'Số sổ', width: '8rem' },
        { key: 'fullName', header: 'Người tham gia' },
        {
          key: 'amount',
          header: 'Số tiền',
          align: 'right',
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'issuedAt', header: 'Ngày thu', render: (row) => formatDate(row.issuedAt) },
        { key: 'collectorName', header: 'Người thu' },
      ]}
    />
  );
}

/** Biên lai điện tử — thêm cột mã tra cứu và thời điểm gửi. */
export function EReceiptsPage() {
  return (
    <ResourceListPage
      title="Biên lai điện tử"
      endpoint={endpoints.resources.insuranceReceipts}
      filters={{ type: 'electronic' }}
      searchPlaceholder="Tìm theo số biên lai, mã tra cứu…"
      columns={[
        { key: 'receiptNo', header: 'Số biên lai', width: '10rem' },
        { key: 'lookupCode', header: 'Mã tra cứu', width: '10rem' },
        { key: 'fullName', header: 'Người tham gia' },
        {
          key: 'amount',
          header: 'Số tiền',
          align: 'right',
          render: (row) => formatCurrency(row.amount),
        },
        { key: 'sentAt', header: 'Thời điểm gửi', render: (row) => formatDateTime(row.sentAt) },
        { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}

/** Đại lý thu và người dùng thuộc đại lý. */
export function AgentsPage() {
  return (
    <ResourceListPage
      title="Quản lý đại lý"
      endpoint={endpoints.resources.agents}
      searchPlaceholder="Tìm theo tên, mã đại lý…"
      columns={[
        { key: 'code', header: 'Mã đại lý', width: '10rem' },
        { key: 'name', header: 'Tên đại lý' },
        { key: 'provinceName', header: 'Tỉnh/thành' },
        { key: 'phone', header: 'Điện thoại', width: '10rem' },
        {
          key: 'isActive',
          header: 'Trạng thái',
          width: '8rem',
          render: (row) => (
            <Badge tone={row.isActive ? 'green' : 'gray'}>
              {row.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
          ),
        },
      ]}
    />
  );
}

/** Tra cứu lịch sử tham gia bảo hiểm của một người. */
export function InsuranceHistoryPage() {
  return (
    <ResourceListPage
      title="Lịch sử bảo hiểm"
      description="Tra cứu quá trình tham gia theo mã số BHXH hoặc số CCCD."
      endpoint={endpoints.resources.insuranceHistory}
      searchPlaceholder="Nhập mã số BHXH hoặc CCCD…"
      columns={[
        { key: 'insuranceNo', header: 'Mã số BHXH', width: '12rem' },
        { key: 'fullName', header: 'Người tham gia' },
        { key: 'fromDate', header: 'Từ ngày', render: (row) => formatDate(row.fromDate) },
        { key: 'toDate', header: 'Đến ngày', render: (row) => formatDate(row.toDate) },
        { key: 'facilityName', header: 'Nơi KCB ban đầu' },
        {
          key: 'amount',
          header: 'Mức đóng',
          align: 'right',
          render: (row) => formatCurrency(row.amount),
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
      description="Danh sách quyền được hệ thống sinh ra theo từng chức năng."
      endpoint={endpoints.resources.permissions}
      searchPlaceholder="Tìm theo tên quyền…"
      columns={[
        { key: 'name', header: 'Tên quyền' },
        { key: 'group', header: 'Nhóm chức năng' },
        { key: 'description', header: 'Mô tả' },
      ]}
    />
  );
}

/** Vai trò và số quyền/số người dùng đang gán. */
export function RolesPage() {
  return (
    <ResourceListPage
      title="Vai trò"
      endpoint={endpoints.resources.roles}
      searchPlaceholder="Tìm theo tên vai trò…"
      columns={[
        { key: 'name', header: 'Vai trò' },
        {
          key: 'permissionsCount',
          header: 'Số quyền',
          align: 'right',
          width: '8rem',
        },
        { key: 'usersCount', header: 'Số người dùng', align: 'right', width: '10rem' },
        { key: 'createdAt', header: 'Ngày tạo', render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
