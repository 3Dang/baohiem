/** Định dạng số theo chuẩn Việt Nam: 1.234.567 */
export const formatNumber = (value) =>
  value == null || value === '' ? '—' : new Intl.NumberFormat('vi-VN').format(value);

/** Định dạng tiền VNĐ, không hiển thị phần thập phân. */
export const formatCurrency = (value) =>
  value == null || value === ''
    ? '—'
    : new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(value);

/** Ngày dạng dd/MM/yyyy. Nhận ISO string hoặc Date. */
export const formatDate = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

/** Ngày giờ dạng dd/MM/yyyy HH:mm — dùng cho log, lịch sử. */
export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};
