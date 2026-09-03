import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { SelectField, TextField } from '@/components/ui/Field';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

/**
 * Ba cách tra cứu một người tham gia. Mỗi cách tự mang theo nhãn, gợi ý nhập
 * và luật kiểm tra riêng để không phải rải if/else trong phần xử lý submit.
 */
const SEARCH_TYPES = {
  cccd: {
    label: 'Căn cước công dân (CCCD)',
    fieldLabel: 'Nhập số CCCD (9 hoặc 12 chữ số)',
    placeholder: 'Ví dụ: 001234567890',
    inputMode: 'numeric',
    validate: (value) =>
      /^(\d{9}|\d{12})$/.test(value) ? null : 'Số CCCD phải gồm đúng 9 hoặc 12 chữ số.',
  },
  insurance_code: {
    label: 'Mã BHXH (10 chữ số)',
    fieldLabel: 'Nhập mã số BHXH',
    placeholder: 'Ví dụ: 0123456789',
    inputMode: 'numeric',
    validate: (value) =>
      /^\d{10}$/.test(value) ? null : 'Mã số BHXH phải gồm đúng 10 chữ số.',
  },
  name: {
    label: 'Họ và tên',
    fieldLabel: 'Nhập họ và tên',
    placeholder: 'Ví dụ: Nguyễn Văn An',
    validate: (value) =>
      value.trim().length >= 2 ? null : 'Nhập ít nhất 2 ký tự để tra cứu theo tên.',
  },
};

const TYPE_OPTIONS = Object.entries(SEARCH_TYPES).map(([value, config]) => ({
  value,
  label: config.label,
}));

const RESULT_COLUMNS = [
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
];

/**
 * Khối tra cứu thông tin bảo hiểm trên Bảng điều khiển.
 *
 * Gọi `GET /insurance-history?search=&search_type=` — dùng lại endpoint của
 * trang Lịch sử bảo hiểm nên backend không cần thêm route mới. Chạy bằng
 * `useMutation` (không phải `useQuery`) vì chỉ được tra khi người dùng bấm
 * Tìm kiếm, chứ không tự gọi lại khi component render.
 */
export default function InsuranceLookup() {
  const [type, setType] = useState('cccd');
  const [value, setValue] = useState('');
  const [clientError, setClientError] = useState(null);

  const config = SEARCH_TYPES[type];

  const lookup = useMutation({
    mutationFn: (params) => http.get(endpoints.resources.insuranceHistory, { params }),
  });

  const submit = (event) => {
    event.preventDefault();

    const message = config.validate(value.trim());
    setClientError(message);
    if (message) return;

    lookup.mutate({ search: value.trim(), search_type: type });
  };

  /** Đổi loại tra cứu thì luật kiểm tra cũng đổi — xoá dữ liệu nhập cũ cho gọn. */
  const changeType = (nextType) => {
    setType(nextType);
    setValue('');
    setClientError(null);
    lookup.reset();
  };

  const rows = lookup.data?.data ?? [];
  // Tra theo tên có thể khớp hàng nghìn người; response chỉ mang một trang nên
  // phải nói rõ tổng số, nếu không người dùng tưởng chỉ có đúng mấy dòng này
  const total = lookup.data?.meta?.total ?? rows.length;
  const serverError = lookup.error;

  return (
    <Card
      title="Tra cứu thông tin bảo hiểm"
      description="Tìm quá trình tham gia theo CCCD, mã số BHXH hoặc họ tên."
    >
      <form onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Loại tìm kiếm"
            required
            value={type}
            onChange={(event) => changeType(event.target.value)}
            options={TYPE_OPTIONS}
          />
          <TextField
            label={config.fieldLabel}
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={config.placeholder}
            inputMode={config.inputMode}
            error={clientError ?? serverError?.fieldError('search')}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" loading={lookup.isPending}>
            <Icon name="search" className="h-4 w-4" />
            Tìm kiếm
          </Button>
          {(rows.length > 0 || serverError) && (
            <Button type="button" variant="secondary" onClick={() => changeType(type)}>
              Xoá kết quả
            </Button>
          )}
        </div>
      </form>

      {/* Lỗi 422 đã hiển thị ngay dưới field, ở đây chỉ báo các lỗi còn lại */}
      {serverError && serverError.status !== 422 && (
        <Alert className="mt-4" title="Không tra cứu được">
          {serverError.message}
        </Alert>
      )}

      {lookup.isSuccess && (
        <div className="mt-4 -mx-4 -mb-4 border-t border-gray-200">
          {total > rows.length && (
            <p className="px-4 pt-3 text-xs text-gray-600">
              Khớp {formatNumber(total)} hồ sơ, đang hiện {formatNumber(rows.length)} hồ sơ đầu
              tiên. Thu hẹp từ khoá, hoặc mở{' '}
              <Link to="/insurance-history" className="font-medium text-brand-700 hover:underline">
                Lịch sử bảo hiểm
              </Link>{' '}
              để xem đầy đủ.
            </p>
          )}
          <DataTable
            columns={RESULT_COLUMNS}
            rows={rows}
            empty={
              <EmptyState
                icon="search"
                title="Không tìm thấy hồ sơ"
                description="Kiểm tra lại thông tin đã nhập hoặc thử tra cứu theo tiêu chí khác."
              />
            }
          />
        </div>
      )}
    </Card>
  );
}
