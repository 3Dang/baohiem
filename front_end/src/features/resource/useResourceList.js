import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import http from '@/lib/http';
import { useDebouncedValue } from '@/lib/hooks';

/**
 * Lấy danh sách phân trang từ một endpoint REST.
 *
 * Backend cần trả về đúng khuôn Laravel paginator:
 * `{ data: [...], meta: { current_page, per_page, total } }`
 *
 * Query gửi lên: `?page=&per_page=&search=&sort_by=&sort_dir=&<filters>`
 *
 * Sắp xếp cũng do server làm (không sort tại client) vì bảng chỉ giữ một
 * trang — sort tại client sẽ chỉ đúng trong phạm vi trang đang xem.
 *
 * @param {string} endpoint
 * @param {{ filters?: Record<string, any>, perPage?: number,
 *           sortBy?: string, sortDir?: 'asc'|'desc' }} [options]
 */
export function useResourceList(
  endpoint,
  { filters = {}, perPage: initialPerPage = 25, sortBy = null, sortDir = 'asc' } = {},
) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ by: sortBy, dir: sortDir });
  const debouncedSearch = useDebouncedValue(search);

  const params = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    sort_by: sort.by || undefined,
    sort_dir: sort.by ? sort.dir : undefined,
    ...filters,
  };

  const query = useQuery({
    queryKey: [endpoint, params],
    queryFn: () => http.get(endpoint, { params }),
    // Giữ dữ liệu trang trước khi đổi trang để bảng không nhảy về trạng thái rỗng
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.data ?? [],
    total: query.data?.meta?.total ?? 0,
    // Số liệu tổng của cả tập kết quả (dòng TỔNG CỘNG), không chỉ trang đang xem
    totals: query.data?.totals,
    // Điều kiện đang áp dụng, để "chọn tất cả kết quả" hỏi server đúng tập id
    params,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    page,
    perPage,
    search,
    sort,
    setSearch: (value) => {
      setSearch(value);
      // Đổi từ khoá thì phải về trang 1, nếu không sẽ rơi vào trang trống
      setPage(1);
    },
    setPage,
    setPerPage: (value) => {
      setPerPage(value);
      setPage(1);
    },
    /** Đặt thẳng cột và chiều sắp xếp — dùng cho cặp ô chọn "Sắp xếp theo". */
    setSort: (next) => {
      setSort({ by: next.by || null, dir: next.dir ?? 'asc' });
      setPage(1);
    },
    /** Bấm lại cột đang sắp xếp thì đảo chiều, cột khác thì bắt đầu từ tăng dần. */
    toggleSort: (key) => {
      setSort((prev) => ({
        by: key,
        dir: prev.by === key && prev.dir === 'asc' ? 'desc' : 'asc',
      }));
      setPage(1);
    },
  };
}
