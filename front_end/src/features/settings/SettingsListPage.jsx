import ResourceListPage from '@/features/resource/ResourceListPage';
import { endpoints } from '@/lib/endpoints';
import { formatDateTime } from '@/lib/format';

/**
 * Tham số tính toán của hệ thống, mỗi dòng một khoá.
 *
 * Khác trang "Cài đặt hệ thống" (form nhóm): ở đây thêm/xoá được khoá mới, vì
 * công thức tính mức đóng có thể phát sinh tham số mà frontend chưa biết trước.
 */
const SETTING_FIELDS = [
  {
    name: 'key',
    label: 'Key',
    required: true,
    placeholder: 'base_salary',
    hint: 'Chữ thường, nối bằng dấu gạch dưới.',
  },
  { name: 'value', label: 'Giá trị của ô', required: true },
  { name: 'description', label: 'Mô tả', colSpan: 2 },
];

export default function SettingsListPage() {
  return (
    <ResourceListPage
      title="Cài đặt"
      breadcrumb={[{ label: 'Cài Đặt' }, { label: 'Danh sách' }]}
      endpoint={endpoints.resources.settings}
      searchPlaceholder="Tìm theo key, mô tả…"
      recordLabel="Cài đặt"
      createLabel="Tạo mới Cài đặt"
      rowLabel={(row) => row.key}
      formFields={SETTING_FIELDS}
      perPage={10}
      emptyDescription="Chưa khai báo tham số nào."
      columns={[
        {
          key: 'key',
          header: 'Key',
          width: '16rem',
          sortable: true,
          render: (row) => <span className="font-medium text-brand-800">{row.key}</span>,
        },
        { key: 'value', header: 'Giá trị của ô', width: '12rem', sortable: true },
        { key: 'description', header: 'Mô tả' },
        {
          key: 'createdAt',
          header: 'Ngày tạo',
          width: '11rem',
          render: (row) => formatDateTime(row.createdAt),
        },
      ]}
    />
  );
}
