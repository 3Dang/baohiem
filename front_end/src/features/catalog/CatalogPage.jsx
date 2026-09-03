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

/**
 * Hai field mọi danh mục đều có, đặt trong một khối có tiêu đề như hệ thống cũ.
 *
 * Ô mã mang tiền tố "#" và ô tên mang biểu tượng của chính danh mục: hai ô cùng
 * độ dài nằm cạnh nhau rất dễ điền lẫn, còn `placeholder` dạng "VD: …" nói ngay
 * định dạng mong đợi thay vì để người dùng gõ thử rồi nhận lỗi 422.
 *
 * @param {{ group: string, groupIcon?: string, groupCollapsible?: boolean,
 *           code: { label?: string, placeholder: string, hint?: string },
 *           name: { label: string, icon?: string, placeholder: string, hint?: string } }} config
 */
const identityFields = ({ group, groupIcon, groupCollapsible, code, name }) => [
  {
    name: 'code',
    label: code.label ?? 'Mã',
    required: true,
    prefix: '#',
    placeholder: code.placeholder,
    hint: code.hint,
    group,
    groupIcon,
    groupCollapsible,
  },
  {
    name: 'name',
    label: name.label,
    required: true,
    prefixIcon: name.icon,
    placeholder: name.placeholder,
    hint: name.hint,
    group,
    colSpan: name.colSpan,
  },
];

/**
 * Ô chọn đơn vị hành chính cha, nạp từ chính danh mục của đơn vị đó.
 *
 * Phải là ô chọn chứ không phải ô gõ tay: tên đơn vị lưu thành chuỗi nên gõ sai
 * một dấu là bản ghi con treo lơ lửng, không thuộc đơn vị nào cả — mà bảng vẫn
 * hiện bình thường nên rất lâu sau mới phát hiện.
 *
 * `dependsOn` là ô chọn phụ thuộc: chưa chọn cha thì ô con khoá lại và chỉ nạp
 * danh sách thuộc đơn vị cha đó.
 */
const parentField = (name, label, { endpoint, dependsOn, ...overrides }) => ({
  name,
  label,
  required: true,
  placeholder: `Chọn ${label.toLowerCase()}`,
  optionsFrom: { endpoint, dependsOn },
  ...overrides,
});

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
    formFields: identityFields({
      group: 'Thông tin tỉnh/thành phố',
      groupIcon: 'building',
      groupCollapsible: true,
      code: { placeholder: 'VD: HCM, HN, DN' },
      name: {
        label: 'Tên tỉnh/thành phố',
        icon: 'building',
        placeholder: 'VD: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng',
      },
    }),
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
    formFields: [
      ...identityFields({
        group: 'Thông tin quận/huyện',
        groupIcon: 'building',
        code: { placeholder: 'VD: 785, 786' },
        name: { label: 'Tên quận/huyện', icon: 'building', placeholder: 'VD: Huyện An Biên' },
      }),
      parentField('provinceName', 'Tỉnh/Thành phố', {
        endpoint: endpoints.resources.provinces,
        group: 'Thông tin quận/huyện',
        hint: 'Tỉnh/thành phố mà quận/huyện thuộc về.',
      }),
    ],
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
      ...identityFields({
        group: 'Thông tin phường/xã',
        groupIcon: 'home',
        code: { placeholder: 'VD: 00001, 00002', hint: 'Mã định danh duy nhất của phường/xã.' },
        name: {
          label: 'Tên phường/xã',
          icon: 'home',
          placeholder: 'VD: Phường Ba Đình, Xã An Khánh',
        },
      }),
      parentField('provinceName', 'Tỉnh/Thành phố', {
        endpoint: endpoints.resources.provinces,
        group: 'Thông tin phường/xã',
        hint: 'Chọn tỉnh/thành phố trước.',
      }),
      parentField('districtName', 'Quận/Huyện', {
        endpoint: endpoints.resources.districts,
        dependsOn: 'provinceName',
        group: 'Thông tin phường/xã',
        hint: 'Quận/huyện mà phường/xã thuộc về.',
      }),
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
    formFields: [
      ...identityFields({
        group: 'Thông tin thôn/ấp',
        groupIcon: 'map',
        code: {
          label: 'Mã thôn/ấp',
          placeholder: 'VD: T001, A002',
          hint: 'Mã định danh duy nhất của thôn/ấp.',
        },
        name: {
          label: 'Tên thôn/ấp',
          icon: 'map',
          placeholder: 'VD: Thôn Hòa Bình, Ấp Tân Tiến',
          hint: 'Tên đầy đủ của thôn/ấp.',
        },
      }),
      parentField('provinceName', 'Tỉnh/Thành phố', {
        endpoint: endpoints.resources.provinces,
        group: 'Thông tin thôn/ấp',
        hint: 'Chọn tỉnh/thành phố trước.',
      }),
      parentField('wardName', 'Phường/Xã', {
        endpoint: endpoints.resources.wards,
        dependsOn: 'provinceName',
        group: 'Thông tin thôn/ấp',
        hint: 'Phường/xã mà thôn/ấp thuộc về.',
      }),
    ],
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
      {
        name: 'code',
        label: 'Mã cơ sở',
        required: true,
        prefix: '#',
        placeholder: 'VD: BV001, PK002',
        hint: 'Mã định danh duy nhất của cơ sở y tế.',
        group: 'Thông tin nơi khám chữa bệnh',
        groupIcon: 'hospital',
      },
      parentField('provinceName', 'Tỉnh/Thành phố', {
        endpoint: endpoints.resources.provinces,
        group: 'Thông tin nơi khám chữa bệnh',
        hint: 'Tỉnh/thành phố nơi cơ sở y tế đặt trụ sở.',
      }),
      /*
       * Sau sáp nhập tỉnh, một cơ sở có hai tên tỉnh: tên trên hồ sơ cũ và tên
       * hiện hành. Ô này để trống được (cơ sở ở tỉnh không sáp nhập) nên có nút
       * bỏ chọn — chọn nhầm rồi mà không bỏ được thì phải huỷ cả form.
       */
      parentField('newProvinceName', 'Tỉnh/Thành phố (mới)', {
        endpoint: endpoints.resources.provinces,
        group: 'Thông tin nơi khám chữa bệnh',
        required: false,
        clearable: true,
        placeholder: 'Chọn tỉnh/thành phố sau sáp nhập',
        hint: 'Để trống nếu tỉnh/thành phố không thay đổi.',
      }),
      {
        name: 'level',
        label: 'Tuyến',
        options: ['Trung ương', 'Tỉnh', 'Huyện', 'Xã'].map((value) => ({ value, label: value })),
        placeholder: 'Chọn tuyến',
        clearable: true,
        group: 'Thông tin nơi khám chữa bệnh',
      },
      {
        name: 'name',
        label: 'Tên cơ sở khám chữa bệnh',
        required: true,
        prefixIcon: 'hospital',
        placeholder: 'VD: Bệnh viện Chợ Rẫy, Phòng khám Đa khoa ABC',
        hint: 'Tên đầy đủ của cơ sở y tế.',
        colSpan: 'full',
        group: 'Thông tin nơi khám chữa bệnh',
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
    formFields: identityFields({
      group: 'Thông tin quan hệ',
      groupIcon: 'heart',
      code: { label: 'Mã quan hệ', placeholder: 'VD: F01, M02' },
      name: {
        label: 'Mô tả quan hệ',
        icon: 'heart',
        placeholder: 'VD: Cha, Mẹ, Con, Anh/Chị/Em',
      },
    }),
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
      ...identityFields({
        group: 'Thông tin mức đóng',
        groupIcon: 'coin',
        code: { label: 'Mức đóng', placeholder: 'VD: 40, 50, 4.5' },
        name: {
          label: 'Mô tả',
          icon: 'document',
          placeholder: 'VD: Người thứ nhất: 100%',
          colSpan: 2,
        },
      }),
      {
        name: 'rate',
        label: 'Tỉ lệ (%)',
        type: 'number',
        required: true,
        min: 0,
        max: 100,
        step: 0.5,
        group: 'Thông tin mức đóng',
      },
      {
        name: 'amount',
        label: 'Số tiền',
        type: 'number',
        required: true,
        min: 0,
        step: 1000,
        hint: 'Đơn vị đồng, nhập số nguyên.',
        group: 'Thông tin mức đóng',
      },
      {
        name: 'months',
        label: 'Số tháng',
        type: 'number',
        required: true,
        min: 1,
        group: 'Thông tin mức đóng',
      },
    ],
  },
  ethnicities: {
    title: 'Danh mục dân tộc',
    recordLabel: 'dân tộc',
    endpoint: endpoints.resources.ethnicities,
    perPage: 50,
    columns: [codeColumn(), nameColumn('Tên dân tộc'), createdAtColumn],
    formFields: identityFields({
      group: 'Thông tin dân tộc',
      groupIcon: 'flag',
      code: { placeholder: 'VD: 1, 2, 3' },
      name: { label: 'Tên dân tộc', icon: 'flag', placeholder: 'VD: Kinh, Tày, Khmer' },
    }),
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
