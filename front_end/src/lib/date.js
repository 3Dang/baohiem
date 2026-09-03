/**
 * Tiện ích ngày tháng cho bộ lọc. Trả về chuỗi `yyyy-MM-dd` vì đó là dạng duy
 * nhất `input[type=date]` nhận và cũng là dạng backend nhận cho tham số lọc.
 */

/** `yyyy-MM-dd` theo giờ địa phương (không dùng toISOString để tránh lệch múi giờ). */
export const toISODate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const todayISO = () => toISODate(new Date());

export const startOfMonthISO = () => {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
};

export const endOfMonthISO = () => {
  const now = new Date();
  // Ngày 0 của tháng sau chính là ngày cuối tháng này
  return toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

/** `yyyy-MM` của tháng hiện tại — dùng cho bộ lọc theo tháng cấp lại. */
export const currentMonthISO = () => startOfMonthISO().slice(0, 7);

/**
 * Danh sách tháng để chọn, tính lùi từ tháng hiện tại.
 * @param {number} [count=18] số tháng
 * @returns {Array<{ value: string, label: string }>} `{ '2026-09', 'Tháng 9/2026' }`
 */
export const monthOptions = (count = 18) => {
  const now = new Date();

  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = date.getMonth() + 1;

    return {
      value: `${date.getFullYear()}-${String(month).padStart(2, '0')}`,
      label: `Tháng ${month}/${date.getFullYear()}`,
    };
  });
};
