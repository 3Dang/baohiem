/** Tham số điều khiển truy vấn — không ảnh hưởng tới tập bản ghi khớp bộ lọc. */
const NON_FILTER_PARAMS = new Set(['page', 'per_page', 'sort_by', 'sort_dir']);

/**
 * Bỏ tham số phân trang và sắp xếp, chỉ giữ điều kiện lọc.
 *
 * Dùng cho những truy vấn nói về **cả tập kết quả** chứ không riêng trang đang
 * xem: lấy toàn bộ id để "chọn tất cả", đếm số bản ghi của từng tab. Nhờ vậy
 * hai lần gọi ở hai trang hoặc hai thứ tự sắp xếp khác nhau dùng chung một
 * cache, không gọi lại API.
 *
 * @param {Record<string, any>} params
 * @returns {Record<string, any>}
 */
export function filterParamsOf(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => !NON_FILTER_PARAMS.has(key)),
  );
}

/** Tham số chỉ nói về trang đang xem, không nói về tập kết quả. */
const PAGE_PARAMS = new Set(['page', 'per_page']);

/**
 * Tham số cho một lần kết xuất: bỏ phân trang, giữ bộ lọc **và** thứ tự sắp xếp.
 *
 * Khác `filterParamsOf`: tệp kết xuất phải chứa cả tập kết quả (nên bỏ trang)
 * nhưng đúng thứ tự người dùng đang xem — bản kê D03 gom theo mã hộ chỉ đúng
 * khi các dòng cùng hộ nằm liền nhau, và người đọc tệp mong thứ tự giống bảng.
 *
 * @param {Record<string, any>} params
 * @returns {Record<string, any>}
 */
export function exportParamsOf(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => !PAGE_PARAMS.has(key) && value !== '' && value != null,
    ),
  );
}

/**
 * Điều kiện lọc mà một tab đại diện.
 *
 * Phần lớn dải tab chỉ chọn giá trị cho **một** trường (trạng thái trả biên:
 * tất cả / chưa trả / đã trả) nên khai `tabs.name` là đủ. Dải tab của Lịch sử
 * bảo hiểm lại cắt tập dữ liệu theo nhiều chiều khác nhau (loại bảo hiểm,
 * nguồn, khoảng thời gian), vì vậy mỗi tab được phép mang bộ lọc riêng.
 *
 * @param {{ name?: string, items?: Array<{ value: string, filters?: object }> }} tabs
 * @param {string} value giá trị của tab đang chọn
 * @returns {Record<string, any>} rỗng nếu là tab "tất cả"
 */
export function tabFiltersOf(tabs, value) {
  const item = tabs?.items?.find((entry) => entry.value === value);
  if (item?.filters) return item.filters;

  return tabs?.name && value ? { [tabs.name]: value } : {};
}
