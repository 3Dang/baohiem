import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { filterParamsOf } from './params';

/**
 * Danh sách id đang được chọn trong bảng, phục vụ hành động hàng loạt.
 *
 * Giữ ở trang cha (không trong DataTable) để lựa chọn không bị mất mỗi lần
 * bảng tải lại dữ liệu.
 *
 * Hai mức "chọn tất cả" khác nhau, đúng như hệ thống cũ:
 * - checkbox ở đầu bảng: chọn các dòng **trong trang đang xem**
 * - liên kết "Chọn tất cả N kết quả": chọn **mọi dòng khớp bộ lọc**, kể cả ở
 *   trang khác. Vì bảng chỉ nắm một trang, id các trang còn lại phải hỏi
 *   server qua `GET /<endpoint>/ids` (chỉ trả mảng id nên rất nhẹ).
 *
 * @param {string} endpoint
 * @param {{ params?: Record<string, any> }} [options] điều kiện lọc đang áp dụng
 */
export function useRowSelection(endpoint, { params = {} } = {}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  /** Chọn/bỏ chọn cả trang hiện tại, không đụng tới id ở trang khác. */
  const toggleAll = (ids, checked) =>
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, ...ids])] : prev.filter((id) => !ids.includes(id)),
    );

  const clear = () => setSelectedIds([]);

  /**
   * Chọn mọi bản ghi khớp bộ lọc hiện tại.
   *
   * Bỏ tham số phân trang và sắp xếp khi gọi: tập id khớp bộ lọc không đổi theo
   * trang đang xem hay thứ tự hiển thị. Nhờ vậy hai lần bấm ở hai thứ tự sắp
   * xếp khác nhau dùng chung một cache, không gọi API lại.
   */
  const selectAllMatching = async () => {
    const filterParams = filterParamsOf(params);

    setLoadingAll(true);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: [endpoint, 'ids', filterParams],
        queryFn: () => http.get(`${endpoint}/ids`, { params: filterParams }),
        staleTime: 30 * 1000,
      });

      setSelectedIds(data?.ids ?? []);
      return data?.ids?.length ?? 0;
    } finally {
      setLoadingAll(false);
    }
  };

  return {
    selectedIds,
    toggleRow,
    toggleAll,
    clear,
    selectAllMatching,
    loadingAll,
    count: selectedIds.length,
  };
}
