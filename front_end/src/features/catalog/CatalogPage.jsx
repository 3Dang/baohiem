import ResourceListPage from '@/features/resource/ResourceListPage';
import ToggleCell from '@/features/resource/ToggleCell';
import Badge from '@/components/ui/Badge';
import ImportExcelButton from '@/components/ui/ImportExcelButton';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDateTime } from '@/lib/format';

/** Cột dùng lại cho mọi danh mục: mã hiện dạng "# 92" như hệ thống cũ. */
const codeColumn = (header = 'Mã') => ({
  key: 'code',
  header,
  width: '8rem',
  sortable: true,
  render: (row) => (
    <Badge tone="brand" className="font-mono">
      # {row.code}
    </Badge>
  ),
});

const nameColumn = (header = 'Tên') => ({ key: 'name', header, sortable: true });

/** Tên đơn vị hành chính cha — nhãn màu để phân biệt với tên của chính dòng. */
const parentColumn = (key, header) => ({
  key,
  header,
  width: '12rem',
  sortable: true,
  render: (row) => (row[key] ? <Badge tone="amber">{row[key]}</Badge> : '—'),
});

/** Số bản ghi con (số phường/xã của huyện, số thôn của xã). */
const countColumn = (key, header) => ({
  key,
  header,
  width: '9rem',
  render: (row) => <Badge tone="green">{row[key] ?? 0}</Badge>,
});

const createdAtColumn = {
  key: 'createdAt',
  header: 'Ngày tạo',
  width: '11rem',
  sortable: true,
  render: (row) => formatDateTime(row.createdAt),
};

/**
 * Cột trạng thái là công tắc bật/tắt ngay trên bảng — đổi trạng thái là việc
 * hay làm nhất với danh mục, không đáng phải mở hộp thoại sửa.
 */
const statusColumn = (endpoint) => ({
  key: 'isActive',
  header: 'Hoạt động',
  width: '8rem',
  render: (row) => <ToggleCell endpoint={endpoint} row={row} field="isActive" />,
});

/** Hai field mọi danh mục đều có; danh mục nào cần thêm thì nối vào sau. */
const baseFields = (nameLabel = 'Tên') => [
  { name: 'code', label: 'Mã', required: true },
  { name: 'name', label: nameLabel, required: true },
];

/** Menu "Thao tác" cho danh mục nhiều cột: để liên kết rời sẽ làm bảng quá rộng. */
const ROW_MENU = [
  { key: 'edit', label: 'Chỉnh sửa', icon: 'pencil' },
  { key: 'delete', label: 'Xoá', icon: 'trash', tone: 'danger' },
];

/**
 * Khai báo toàn bộ danh mục hành chính & nghiệp vụ.
 * Thêm danh mục mới = thêm một entry, không cần viết component riêng.
 *
 * `excelImport` bật nút "Nhập thông tin từ Excel" ở đầu trang; `rowMenu` gom
 * hành động vào menu "Thao tác" thay vì để liên kết rời (bảng nhiều cột).
 */
const CATALOGS = {
  provinces: {
    title: 'Danh mục tỉnh/thành phố',
    recordLabel: 'Tỉnh/Thành phố',
    endpoint: endpoints.resources.provinces,
    excelImport: true,
    perPage: 50,
    columns: [codeColumn(), nameColumn('Tên tỉnh/thành phố'), createdAtColumn],
    formFields: baseFields('Tên tỉnh/thành phố'),
  },
  districts: {
    title: 'Danh mục quận/huyện',
    recordLabel: 'quận/huyện',
    endpoint: endpoints.resources.districts,
    perPage: 50,
    rowMenu: true,
    columns: [
      codeColumn(),
      nameColumn('Tên quận/huyện'),
      parentColumn('provinceName', 'Tỉnh/Thành phố'),
      countColumn('wardsCount', 'Số phường/xã'),
      createdAtColumn,
    ],
    formFields: [...baseFields('Tên quận/huyện'), { name: 'provinceName', label: 'Tỉnh/thành' }],
  },
  wards: {
    title: 'Danh mục phường/xã',
    recordLabel: 'phường/xã',
    endpoint: endpoints.resources.wards,
    createLabel: 'Nhập xã mới',
    perPage: 50,
    rowMenu: true,
    columns: [
      codeColumn(),
      nameColumn('Tên ngắn'),
      { key: 'fullName', header: 'Tên đầy đủ' },
      parentColumn('provinceName', 'Tỉnh/Thành phố'),
      {
        key: 'oldCodes',
        header: 'Mã cũ',
        // Xã sau sáp nhập gộp nhiều mã cũ; hiện nguyên chuỗi để tra cứu hồ sơ cũ
        render: (row) =>
          row.oldCodes ? (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-800">
              {row.oldCodes}
            </span>
          ) : (
            '—'
          ),
      },
      { key: 'provinceCode', header: 'Mã tỉnh', width: '7rem' },
      countColumn('hamletsCount', 'Số thôn/xóm'),
      createdAtColumn,
    ],
    formFields: [
      ...baseFields('Tên phường/xã'),
      { name: 'districtName', label: 'Quận/huyện' },
      { name: 'provinceName', label: 'Tỉnh/thành' },
    ],
  },
  hamlets: {
    title: 'Danh mục thôn/ấp',
    recordLabel: 'thôn/ấp',
    endpoint: endpoints.resources.hamlets,
    createLabel: 'Nhập ấp mới',
    excelImport: true,
    perPage: 50,
    rowMenu: true,
    columns: [
      codeColumn(),
      nameColumn('Tên thôn/ấp'),
      parentColumn('wardName', 'Phường/Xã'),
      createdAtColumn,
    ],
    formFields: [...baseFields('Tên thôn/ấp'), { name: 'wardName', label: 'Phường/xã' }],
  },
  'medical-facilities': {
    title: 'Danh mục nơi khám chữa bệnh',
    description: 'Cơ sở khám chữa bệnh ban đầu dùng khi kê khai BHYT.',
    recordLabel: 'Nơi khám chữa bệnh',
    endpoint: endpoints.resources.medicalFacilities,
    excelImport: true,
    perPage: 50,
    rowMenu: true,
    columns: [
      codeColumn('Mã cơ sở'),
      nameColumn('Tên cơ sở khám chữa bệnh'),
      parentColumn('provinceName', 'Tỉnh/Thành phố'),
      // Sau sáp nhập tỉnh, hồ sơ cũ vẫn tra theo tên cũ nên giữ cả hai cột
      parentColumn('newProvinceName', 'Tỉnh/Thành phố mới'),
      createdAtColumn,
    ],
    formFields: [
      ...baseFields('Tên cơ sở'),
      { name: 'provinceName', label: 'Tỉnh/thành' },
      {
        name: 'level',
        label: 'Tuyến',
        options: ['Trung ương', 'Tỉnh', 'Huyện', 'Xã'].map((value) => ({ value, label: value })),
        placeholder: 'Chọn tuyến',
      },
    ],
  },
  relationships: {
    title: 'Danh mục quan hệ',
    description: 'Quan hệ với chủ hộ, dùng để xác định mức giảm trừ hộ gia đình.',
    recordLabel: 'Quan hệ',
    endpoint: endpoints.resources.relationships,
    perPage: 50,
    columns: [codeColumn(), nameColumn('Mô tả quan hệ'), createdAtColumn],
    formFields: baseFields('Tên quan hệ'),
  },
  'contribution-levels': {
    title: 'Danh mục mức đóng',
    recordLabel: 'mức đóng',
    endpoint: endpoints.resources.contributionLevels,
    perPage: 50,
    columns: [
      codeColumn('Mức đóng'),
      {
        key: 'rate',
        header: 'Tỉ lệ',
        width: '7rem',
        sortable: true,
        render: (row) => <Badge tone="green">{row.rate}%</Badge>,
      },
      nameColumn('Mô tả'),
      {
        key: 'amount',
        header: 'Số tiền',
        align: 'right',
        sortable: true,
        render: (row) => formatCurrency(row.amount),
      },
      { key: 'months', header: 'Số tháng', align: 'right', width: '7rem' },
      createdAtColumn,
    ],
    formFields: [
      ...baseFields('Tên mức đóng'),
      { name: 'amount', label: 'Số tiền', type: 'number', required: true, min: 0, step: 1000 },
      { name: 'months', label: 'Số tháng', type: 'number', required: true, min: 1 },
    ],
  },
  ethnicities: {
    title: 'Danh mục dân tộc',
    recordLabel: 'dân tộc',
    endpoint: endpoints.resources.ethnicities,
    perPage: 50,
    columns: [codeColumn(), nameColumn('Tên dân tộc'), createdAtColumn],
    formFields: baseFields('Tên dân tộc'),
  },
};

/**
 * Trang danh mục. `type` khớp với đường dẫn /catalog/:type trong router.
 */
export default function CatalogPage({ type }) {
  const config = CATALOGS[type];

  // Route không khớp danh mục nào — thường do sai đường dẫn khi thêm menu mới
  if (!config) return null;

  const recordLabel = config.recordLabel ?? 'bản ghi';

  return (
    <ResourceListPage
      title={config.title}
      breadcrumb={[{ label: config.title }, { label: 'Danh sách' }]}
      description={config.description}
      endpoint={config.endpoint}
      // Cột trạng thái luôn ở cuối, trước cột hành động
      columns={[...config.columns, statusColumn(config.endpoint)]}
      formFields={config.formFields}
      rowActions={config.rowMenu ? ROW_MENU : undefined}
      recordLabel={recordLabel}
      createLabel={config.createLabel ?? `Tạo mới ${recordLabel}`}
      perPage={config.perPage}
      sortBy="code"
      searchPlaceholder="Tìm theo mã hoặc tên…"
      emptyDescription={`Chưa có ${recordLabel} nào trong danh mục.`}
      actions={
        config.excelImport && (
          <ImportExcelButton
            endpoint={`${config.endpoint}/import`}
            title={`Nhập ${recordLabel} từ Excel`}
          />
        )
      }
    />
  );
}

export const CATALOG_TYPES = Object.keys(CATALOGS);
