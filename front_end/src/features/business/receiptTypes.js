/**
 * Loại biên lai, tách riêng khỏi `pages.jsx` để hộp thoại "Nhập từ bhxh" dùng
 * chung được — hộp thoại nằm trong cùng thư mục nhưng `pages.jsx` lại import nó,
 * đặt hằng ở đó thì hai tệp import vòng lẫn nhau.
 */
export const RECEIPT_TYPE_LABELS = { bhyt: 'BHYT', bhxh: 'BHXH', combined: 'BHYT + BHXH' };

export const RECEIPT_TYPE_OPTIONS = Object.entries(RECEIPT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
