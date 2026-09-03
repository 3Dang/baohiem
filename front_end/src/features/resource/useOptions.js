import { useQuery } from '@tanstack/react-query';
import http from '@/lib/http';

/**
 * Số dòng nạp cho một ô chọn.
 *
 * Không thể nạp cả danh mục: bảng xã có hơn ba nghìn dòng. Vì vậy ô chọn có tìm
 * kiếm gửi từ khoá lên server (`search`) chứ không lọc trong số đã tải — lọc tại
 * chỗ thì những dòng ngoài trang đầu coi như không tồn tại, mà người dùng không
 * hề biết.
 */
const OPTION_PAGE_SIZE = 200;

/**
 * Gộp các dòng thành `[{ value, label }]`, bỏ giá trị trùng.
 *
 * Bỏ trùng vì danh mục lấy `value` là **tên** đơn vị (để bản ghi mới lưu đúng
 * tên chứ không phải id): hai dòng cùng tên sẽ thành hai option cùng khoá —
 * React cảnh báo trùng key và ô chọn hiện hai dòng y hệt nhau.
 */
const optionsOf = (rows = [], labelKey, valueKey) => {
  const seen = new Set();
  const options = [];

  rows.forEach((row) => {
    const value = String(row[valueKey] ?? '');
    if (!value || seen.has(value)) return;

    seen.add(value);
    options.push({ value, label: row[labelKey] ?? value });
  });

  return options;
};

/**
 * Nạp một danh mục cho ô chọn, kèm trạng thái đang tải.
 *
 * Dùng chung endpoint danh sách của danh mục đó (không cần API riêng).
 * `staleTime` dài vì danh mục rất ít đổi trong một phiên làm việc.
 *
 * `params` thêm điều kiện lọc: ô chọn phụ thuộc ô khác (phường/xã của tỉnh đang
 * chọn) gửi kèm điều kiện đó thay vì tải cả bảng rồi lọc ở client — bảng xã có
 * hơn ba nghìn dòng, quá `per_page` thì những dòng sau lặng lẽ mất.
 *
 * `search` là từ khoá người dùng đang gõ trong ô chọn, gửi thẳng lên server để
 * tìm trên cả danh mục.
 *
 * `enabled: false` giữ nguyên trạng thái chưa tải: ô chọn con chỉ truy vấn sau
 * khi biết đơn vị cha, nếu không nó tải cả bảng rồi lát sau tải lại.
 *
 * @param {string} endpoint
 * @param {{ labelKey?: string, valueKey?: string, enabled?: boolean,
 *           search?: string, params?: Record<string, any> }} [options]
 * @returns {{ options: Array<{ value: string, label: string }>, loading: boolean,
 *             total: number, truncated: boolean }}
 */
export function useOptionsQuery(
  endpoint,
  { labelKey = 'name', valueKey = 'id', enabled = true, search, params: filters } = {},
) {
  const term = String(search ?? '').trim();
  const params = { per_page: OPTION_PAGE_SIZE, page: 1, ...filters, ...(term ? { search: term } : {}) };

  const { data, isFetching } = useQuery({
    queryKey: [endpoint, params],
    queryFn: () => http.get(endpoint, { params }),
    staleTime: 10 * 60 * 1000,
    enabled: enabled && Boolean(endpoint),
    // Giữ danh sách của từ khoá trước trong lúc chờ: đổi queryKey mỗi lần gõ nên
    // không có cái này thì danh sách nháy trắng sau từng chữ
    placeholderData: (previous) => previous,
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? rows.length;

  return {
    options: optionsOf(rows, labelKey, valueKey),
    loading: isFetching,
    total,
    /*
     * Danh mục dài hơn một trang: ô chọn phải nói rõ, nếu không người dùng tìm
     * không thấy một xã có thật và tưởng danh mục thiếu. So trên số **dòng** đã
     * tải, không phải số option — nhiều dòng có thể cùng một tên (217 đại lý
     * thuộc 4 đơn vị) nên số option ít hơn hẳn mà chẳng có gì bị cắt.
     */
    truncated: total > rows.length,
  };
}

/** Chỉ lấy danh sách option — dùng cho bộ lọc, nơi không cần báo đang tải. */
export function useOptions(endpoint, options) {
  return useOptionsQuery(endpoint, options).options;
}
