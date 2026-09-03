import { useQueries } from '@tanstack/react-query';
import http from '@/lib/http';
import { filterParamsOf, tabFiltersOf } from './params';

/**
 * Số bản ghi của từng tab, để dải tab hiện được con số bên cạnh nhãn.
 *
 * `GET /<endpoint>/counts?<điều kiện của tab>` → `{ total: 157794 }`
 *
 * Một request cho mỗi tab, chạy song song và cache riêng 60 giây. Không gộp
 * thành một câu GROUP BY vì các tab không nhất thiết cắt theo cùng một trường:
 * dải tab của Lịch sử bảo hiểm chia theo loại bảo hiểm, theo nguồn dữ liệu và
 * theo khoảng thời gian — ba chiều khác nhau của cùng một tập.
 *
 * Bỏ tham số phân trang/sắp xếp và bỏ luôn điều kiện do dải tab đặt ra: mỗi tab
 * phải đếm tập con của **chính nó**, không phải đếm trong tập đã lọc bởi tab
 * đang chọn (khi đó mọi tab khác đều bằng 0). Các bộ lọc còn lại thì vẫn giữ,
 * để con số trên tab khớp với những gì bảng đang hiện.
 *
 * @param {string} endpoint
 * @param {{ tabs?: { name?: string, counted?: boolean, items?: Array<object> },
 *           params?: Record<string, any> }} [options]
 * @returns {Array<{ value: string, label: string, count?: number }>} items kèm số
 */
export function useTabCounts(endpoint, { tabs, params = {} } = {}) {
  const items = tabs?.items ?? [];
  // Dải tab không khai `counted` thì không gọi API nào: phần lớn trang chỉ cần
  // nhãn, và đếm mỗi tab một lần là N lần quét cả bảng ở phía server
  const counted = tabs?.counted ? items : [];

  // Điều kiện dùng chung cho mọi tab: bộ lọc của trang, trừ những trường mà
  // chính dải tab điều khiển
  const shared = filterParamsOf(params);
  counted.forEach((item) => {
    Object.keys(tabFiltersOf(tabs, item.value)).forEach((key) => delete shared[key]);
  });

  const results = useQueries({
    queries: counted.map((item) => {
      const query = { ...shared, ...tabFiltersOf(tabs, item.value) };

      return {
        queryKey: [endpoint, 'counts', query],
        queryFn: () => http.get(`${endpoint}/counts`, { params: query }),
        staleTime: 60 * 1000,
      };
    }),
  });

  if (!tabs?.counted) return items;

  // Chưa có số thì tab hiện không kèm số, còn hơn hiện 0 gây hiểu sai
  return items.map((item, index) => ({ ...item, count: results[index]?.data?.total }));
}
