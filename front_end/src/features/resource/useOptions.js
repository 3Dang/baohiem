import { useQuery } from '@tanstack/react-query';
import http from '@/lib/http';

/**
 * Nạp một danh mục về dạng `[{ value, label }]` cho ô chọn trong bộ lọc.
 *
 * Dùng chung endpoint danh sách của danh mục đó (không cần API riêng), lấy
 * `per_page` lớn vì danh mục để chọn thì phải có đủ, không phân trang.
 * `staleTime` dài vì danh mục rất ít đổi trong một phiên làm việc.
 *
 * @param {string} endpoint
 * @param {{ labelKey?: string, valueKey?: string, enabled?: boolean }} [options]
 */
export function useOptions(endpoint, { labelKey = 'name', valueKey = 'id', enabled = true } = {}) {
  const params = { per_page: 200, page: 1 };

  const { data } = useQuery({
    queryKey: [endpoint, params],
    queryFn: () => http.get(endpoint, { params }),
    staleTime: 10 * 60 * 1000,
    enabled,
  });

  return (data?.data ?? []).map((row) => ({
    value: String(row[valueKey]),
    label: row[labelKey] ?? String(row[valueKey]),
  }));
}
