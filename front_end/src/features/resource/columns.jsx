/**
 * Những ô bảng lặp lại ở nhiều trang danh sách.
 *
 * Cột trạng thái nằm riêng ở `status.jsx` vì đi kèm bảng nhãn màu; ở đây chỉ là
 * các cột không mang nghĩa nghiệp vụ (số thứ tự) và cách trình bày dùng lại
 * được (ô hai dòng).
 */

/**
 * Cột STT: số thứ tự trong **cả tập kết quả**, không phải trong trang đang xem.
 * `DataTable` truyền `stt` đã cộng `rowOffset` của trang.
 */
export const sttColumn = {
  key: '__stt',
  header: 'STT',
  align: 'right',
  width: '4.5rem',
  render: (row, stt) => <span className="text-xs text-gray-500">{stt}</span>,
};

/**
 * Ô hai dòng: giá trị chính ở trên, chú thích ở dưới.
 *
 * Hệ thống cũ xếp những cặp số liệu đi liền nhau (ngày biên/ngày duyệt, giới
 * tính/ngày sinh, xã mới/xã cũ) vào cùng một ô — bảng đã hơn mười cột, tách
 * thành hai cột nữa thì phải cuộn ngang mới đọc hết một dòng.
 *
 * @param {React.ReactNode} main
 * @param {React.ReactNode} sub
 */
export const stacked = (main, sub) => (
  <span className="block leading-tight">
    <span className="block text-gray-900">{main}</span>
    <span className="block text-xs text-gray-500">{sub}</span>
  </span>
);
