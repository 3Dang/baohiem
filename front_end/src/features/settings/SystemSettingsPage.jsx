import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ResourceListPage from '@/features/resource/ResourceListPage';
import ToggleCell from '@/features/resource/ToggleCell';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatDateTime } from '@/lib/format';

/** Kiểu dữ liệu của giá trị — quyết định cách kiểm tra khi lưu. */
const VALUE_TYPES = {
  number: { label: 'Số', tone: 'brand' },
  boolean: { label: 'Bool', tone: 'amber' },
  string: { label: 'Chữ', tone: 'gray' },
};

const VALUE_TYPE_OPTIONS = Object.entries(VALUE_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));

/** Các danh mục có sẵn; người dùng cũng gõ được tên mới khi tạo tham số. */
const CATEGORIES = ['Tính toán', 'Biên lai', 'Đơn vị', 'Kết nối'];

const SETTING_GROUP = 'Thông tin tham số hệ thống';

const SETTING_FIELDS = [
  {
    name: 'category',
    label: 'Danh mục',
    required: true,
    options: CATEGORIES.map((value) => ({ value, label: value })),
    placeholder: 'Chọn danh mục',
    group: SETTING_GROUP,
    groupIcon: 'cog',
  },
  {
    name: 'key',
    label: 'Mã cài đặt',
    required: true,
    prefix: '#',
    placeholder: 'VD: base_salary',
    hint: 'Chữ thường, nối bằng dấu gạch dưới — mã này được code tham chiếu.',
    group: SETTING_GROUP,
  },
  {
    name: 'label',
    label: 'Tên cài đặt',
    required: true,
    colSpan: 2,
    placeholder: 'VD: Mức lương cơ sở',
    group: SETTING_GROUP,
  },
  {
    name: 'valueType',
    label: 'Kiểu giá trị',
    required: true,
    options: VALUE_TYPE_OPTIONS,
    defaultValue: 'string',
    group: SETTING_GROUP,
  },
  { name: 'value', label: 'Giá trị', required: true, group: SETTING_GROUP },
];

/**
 * Cài đặt hệ thống — danh sách tham số, mỗi dòng một khoá.
 *
 * Dạng danh sách (không phải form nhóm) vì tham số phát sinh theo nghiệp vụ:
 * công thức tính mức đóng đổi thì thêm khoá mới, frontend không cần biết trước.
 *
 * Tham số `isSystem` do hệ thống quản lý: sửa được giá trị nhưng không xoá,
 * nên hành động của dòng đó là "Đặt lại mặc định" —
 * `POST /system-settings/<id>/reset`.
 */
export default function SystemSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const endpoint = endpoints.resources.systemSettings;

  const reset = useMutation({
    mutationFn: (row) => http.post(`${endpoint}/${row.id}/reset`),
    onSuccess: (_data, row) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast.success(`Đã đặt lại “${row.label}” về giá trị mặc định.`);
    },
    onError: (error) => toast.error(error.message),
  });

  const filterFields = useMemo(
    () => [
      {
        name: 'category',
        label: 'Danh mục',
        options: CATEGORIES.map((value) => ({ value, label: value })),
        placeholder: 'Tất cả danh mục',
      },
      {
        name: 'valueType',
        label: 'Kiểu giá trị',
        options: VALUE_TYPE_OPTIONS,
        placeholder: 'Tất cả kiểu',
      },
    ],
    [],
  );

  return (
    <ResourceListPage
      title="Cài đặt hệ thống"
      breadcrumb={[{ label: 'Cài Đặt Hệ Thống' }, { label: 'Danh sách' }]}
      description="Tham số điều khiển cách hệ thống tính toán và kết nối cơ quan BHXH."
      endpoint={endpoint}
      searchPlaceholder="Tìm theo mã, tên cài đặt…"
      recordLabel="Cài đặt hệ thống"
      createLabel="Tạo mới Cài đặt hệ thống"
      rowLabel={(row) => row.label ?? row.key}
      formFields={SETTING_FIELDS}
      filterFields={filterFields}
      filterColumns={2}
      perPage={50}
      emptyDescription="Chưa khai báo tham số hệ thống nào."
      rowActions={[
        {
          key: 'view',
          label: 'Xem',
          icon: 'eye',
          onRun: (row) => toast.info(`${row.key} = ${row.value}`),
        },
        { key: 'edit', label: 'Sửa', icon: 'pencil' },
        {
          key: 'reset',
          label: 'Đặt lại mặc định',
          icon: 'refresh',
          onRun: (row) => reset.mutate(row),
        },
        { key: 'delete', label: 'Xoá', icon: 'trash', tone: 'danger' },
      ]}
      columns={[
        {
          key: 'category',
          header: 'Danh mục',
          width: '10rem',
          sortable: true,
          render: (row) => (
            <span className="inline-flex items-center gap-1.5 text-gray-700">
              <Icon name="folder" className="h-3.5 w-3.5 text-brand-500" />
              {row.category}
            </span>
          ),
        },
        {
          key: 'key',
          header: 'Mã',
          width: '14rem',
          sortable: true,
          // Mã là thứ code tham chiếu tới, nên để font đơn cách cho dễ đối chiếu
          render: (row) => (
            <span className="font-mono text-xs text-brand-800">{row.key}</span>
          ),
        },
        {
          key: 'label',
          header: 'Tên cài đặt',
          sortable: true,
          render: (row) => <span className="font-medium text-gray-900">{row.label}</span>,
        },
        {
          key: 'valueType',
          header: 'Kiểu',
          width: '7rem',
          render: (row) => {
            const type = VALUE_TYPES[row.valueType] ?? VALUE_TYPES.string;
            return <Badge tone={type.tone}>{type.label}</Badge>;
          },
        },
        {
          key: 'value',
          header: 'Giá trị',
          width: '14rem',
          // Kiểu bool lưu 0/1 nhưng đọc ra phải là Bật/Tắt
          render: (row) =>
            row.valueType === 'boolean' ? (
              <span className={row.value === '1' ? 'text-green-700' : 'text-gray-500'}>
                {row.value === '1' ? 'Bật' : 'Tắt'}
              </span>
            ) : (
              <span className="font-medium text-gray-900">{row.value}</span>
            ),
        },
        {
          key: 'isSystem',
          header: 'Hệ thống',
          width: '8rem',
          render: (row) =>
            row.isSystem ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <Icon name="key" className="h-3.5 w-3.5" />
                Hệ thống
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Icon name="user" className="h-3.5 w-3.5" />
                Người dùng
              </span>
            ),
        },
        {
          key: 'isActive',
          header: 'Hoạt động',
          width: '8rem',
          render: (row) => <ToggleCell endpoint={endpoint} row={row} field="isActive" />,
        },
        {
          key: 'updatedAt',
          header: 'Cập nhật lúc',
          width: '12rem',
          sortable: true,
          render: (row) => formatDateTime(row.updatedAt),
        },
      ]}
    />
  );
}
