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
 * Query gửi lên: `?page=&per_page=&search=&<filters>`
 *
 * @param {string} endpoint
 * @param {{ filters?: Record<string, any> }} [options]
 */
export function useResourceList(endpoint, { filters = {} } = {}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const params = { page, per_page: perPage, search: debouncedSearch || undefined, ...filters };

  const query = useQuery({
    queryKey: [endpoint, params],
    queryFn: () => http.get(endpoint, { params }),
    // Giữ dữ liệu trang trước khi đổi trang để bảng không nhảy về trạng thái rỗng
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.data ?? [],
    total: query.data?.meta?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    page,
    perPage,
    search,
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
  };
}
