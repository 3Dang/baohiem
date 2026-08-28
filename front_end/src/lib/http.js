import axios from 'axios';

/**
 * Client HTTP dùng chung cho toàn bộ ứng dụng.
 *
 * Quy ước với backend:
 * - Mọi endpoint nằm dưới VITE_API_BASE_URL (mặc định `/api`).
 * - Xác thực bằng Bearer token gửi ở header `Authorization`.
 * - Lỗi validate trả về HTTP 422 với body `{ message, errors: { field: [msg] } }`
 *   (chuẩn Laravel) — form đọc trực tiếp `errors` để gắn vào từng field.
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { Accept: 'application/json' },
  // Bật để backend có thể chuyển sang cookie httpOnly mà không sửa client
  withCredentials: true,
});

const TOKEN_KEY = 'baohiem.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Chuẩn hoá mọi lỗi mạng về một hình dạng duy nhất cho tầng UI. */
export class ApiError extends Error {
  constructor({ status, message, errors }) {
    super(message);
    this.status = status;
    /** @type {Record<string, string[]>} lỗi theo từng field, rỗng nếu không có */
    this.errors = errors || {};
  }

  /** Lấy thông báo đầu tiên của một field để hiển thị dưới input. */
  fieldError(name) {
    return this.errors[name]?.[0];
  }
}

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error;

    // Token hết hạn: xoá và đẩy về trang đăng nhập, giữ lại đường dẫn đang xem
    if (response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      tokenStore.clear();
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?from=${from}`);
    }

    throw new ApiError({
      status: response?.status ?? 0,
      message:
        response?.data?.message ||
        (response ? 'Đã xảy ra lỗi, vui lòng thử lại.' : 'Không kết nối được tới máy chủ.'),
      errors: response?.data?.errors,
    });
  },
);

export default http;

/**
 * Tải tệp do backend sinh ra (kết xuất D03/D05/AR, biểu mẫu…).
 *
 * Không dùng `http` vì interceptor đã bóc mất phần header, mà tên tệp lại nằm ở
 * `Content-Disposition`. Trả về `{ blob, fileName }` để trang gọi tự quyết định
 * cách lưu; `fallbackName` dùng khi server không gửi tên tệp.
 */
export async function downloadFile(url, { params, fallbackName } = {}) {
  const token = tokenStore.get();

  const response = await axios.get(url, {
    baseURL: http.defaults.baseURL,
    withCredentials: true,
    params,
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const disposition = response.headers['content-disposition'];
  const matched = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);

  return {
    blob: response.data,
    fileName: matched ? decodeURIComponent(matched[1]) : fallbackName,
  };
}
