import ResourceListPage from '@/features/resource/ResourceListPage';
import Badge from '@/components/ui/Badge';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency } from '@/lib/format';

/** Cột dùng lại cho mọi danh mục: mã và tên là bắt buộc ở mọi bảng. */
const codeColumn = { key: 'code', header: 'Mã', width: '8rem' };
const nameColumn = { key: 'name', header: 'Tên' };

/** Cột trạng thái hoạt động, backend trả boolean `isActive`. */
const statusColumn = {
  key: 'isActive',
  header: 'Trạng thái',
  width: '8rem',
  render: (row) => (
    <Badge tone={row.isActive ? 'green' : 'gray'}>
      {row.isActive ? 'Đang dùng' : 'Ngừng dùng'}
    </Badge>
  ),
};

/**
 * Khai báo toàn bộ danh mục hành chính & nghiệp vụ.
 * Thêm danh mục mới = thêm một entry, không cần viết component riêng.
 */
const CATALOGS = {
  provinces: {
    title: 'Danh mục tỉnh/thành',
    endpoint: endpoints.resources.provinces,
    columns: [codeColumn, nameColumn, statusColumn],
  },
  districts: {
    title: 'Danh mục quận/huyện',
    endpoint: endpoints.resources.districts,
    columns: [
      codeColumn,
      nameColumn,
      { key: 'provinceName', header: 'Tỉnh/thành' },
      statusColumn,
    ],
  },
  wards: {
    title: 'Danh mục phường/xã',
    endpoint: endpoints.resources.wards,
    columns: [
      codeColumn,
      nameColumn,
      { key: 'districtName', header: 'Quận/huyện' },
      { key: 'provinceName', header: 'Tỉnh/thành' },
      statusColumn,
    ],
  },
  hamlets: {
    title: 'Danh mục thôn/ấp',
    endpoint: endpoints.resources.hamlets,
    columns: [codeColumn, nameColumn, { key: 'wardName', header: 'Phường/xã' }, statusColumn],
  },
  'medical-facilities': {
    title: 'Danh mục nơi khám chữa bệnh',
    description: 'Cơ sở khám chữa bệnh ban đầu dùng khi kê khai BHYT.',
    endpoint: endpoints.resources.medicalFacilities,
    columns: [
      codeColumn,
      nameColumn,
      { key: 'provinceName', header: 'Tỉnh/thành' },
      { key: 'level', header: 'Tuyến', width: '8rem' },
      statusColumn,
    ],
  },
  relationships: {
    title: 'Danh mục quan hệ',
    description: 'Quan hệ với chủ hộ, dùng để xác định mức giảm trừ hộ gia đình.',
    endpoint: endpoints.resources.relationships,
    columns: [codeColumn, nameColumn, statusColumn],
  },
  'contribution-levels': {
    title: 'Danh mục mức đóng',
    endpoint: endpoints.resources.contributionLevels,
    columns: [
      codeColumn,
      nameColumn,
      {
        key: 'amount',
        header: 'Số tiền',
        align: 'right',
        render: (row) => formatCurrency(row.amount),
      },
      { key: 'months', header: 'Số tháng', align: 'right', width: '7rem' },
      statusColumn,
    ],
  },
  ethnicities: {
    title: 'Danh mục dân tộc',
    endpoint: endpoints.resources.ethnicities,
    columns: [codeColumn, nameColumn, statusColumn],
  },
};

/**
 * Trang danh mục. `type` khớp với đường dẫn /catalog/:type trong router.
 */
export default function CatalogPage({ type }) {
  const config = CATALOGS[type];

  // Route không khớp danh mục nào — thường do sai đường dẫn khi thêm menu mới
  if (!config) return null;

  return (
    <ResourceListPage
      title={config.title}
      description={config.description}
      endpoint={config.endpoint}
      columns={config.columns}
      searchPlaceholder="Tìm theo mã hoặc tên…"
    />
  );
}

export const CATALOG_TYPES = Object.keys(CATALOGS);
