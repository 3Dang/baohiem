import { useQuery } from '@tanstack/react-query';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';

/**
 * Số liệu tóm tắt của trang báo cáo: hôm nay có bao nhiêu hồ sơ chưa duyệt / đã
 * duyệt, hôm qua còn tồn bao nhiêu, và toàn bộ kỳ còn bao nhiêu chưa duyệt.
 *
 * `GET /reports/<type>/stats`
 *   → `{ todayPending, todayApproved, todayTotal, yesterdayPending, totalPending }`
 *
 * Không nhận bộ lọc: các con số này nói về hôm nay và hôm qua, còn bộ lọc trên
 * trang nói về kỳ người dùng đang xem. Gộp vào một truy vấn thì mỗi lần đổi
 * khoảng ngày lại tính lại những số vốn không đổi.
 *
 * @param {'d03'|'ar'|'d05'} type
 */
export function useReportStats(type) {
  const endpoint = endpoints.reportExtras(type).stats;

  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => http.get(endpoint),
    staleTime: 60 * 1000,
  });

  return { stats: data, isLoading };
}

/**
 * Hồ sơ có ngày trên tệp nhập lệch với ngày biên lai.
 *
 * `GET /reports/<type>/date-mismatch` → `{ data: [...], meta: { total } }`
 *
 * Số lượng ít nên trả về thẳng danh sách, không phân trang: khối này chỉ để
 * soát trước khi gửi hồ sơ, mở ra là phải thấy hết.
 *
 * @param {'d03'|'ar'|'d05'} type
 */
export function useDateMismatch(type) {
  const endpoint = endpoints.reportExtras(type).dateMismatch;

  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => http.get(endpoint),
    staleTime: 60 * 1000,
  });

  return { rows: data?.data ?? [], total: data?.meta?.total ?? 0, isLoading };
}
