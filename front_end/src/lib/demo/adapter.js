import {
  DEMO_ACCOUNT,
  DEMO_USER,
  NOTIFICATIONS,
  REPORT_ROWS,
  ROW_BUILDERS,
  SEARCH_GROUPS,
  SETTINGS,
  SUMMARY,
  TOTALS,
} from './data';

/**
 * Giả lập backend cho chế độ demo (VITE_DEMO_MODE=true).
 *
 * Mục đích duy nhất: xem thử giao diện khi API thật chưa có. Adapter được gắn
 * vào axios nên toàn bộ mã nghiệp vụ vẫn gọi API như bình thường — khi backend
 * sẵn sàng chỉ cần tắt biến môi trường, không phải sửa một dòng code nào.
 */

const DEMO_TOKEN = 'demo-token';

/** Độ trễ giả để thấy được trạng thái đang tải, không phải nháy một cái là xong. */
const LATENCY_MS = 250;

/** Bỏ baseURL khỏi url để so khớp theo path thuần. */
const pathOf = (config) => {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  return (url.startsWith(base) ? url.slice(base.length) : url).split('?')[0];
};

/** Khuôn response axios tối thiểu mà interceptor phía sau cần. */
const respond = (config, data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
});

const reject = (config, status, body) =>
  Promise.reject(
    Object.assign(new Error(body.message), {
      config,
      response: { status, data: body, headers: {}, config },
    }),
  );

/** Sinh một trang dữ liệu; chỉ số dòng liên tục giữa các trang. */
function paginate(path, params) {
  const build = ROW_BUILDERS[path];
  const total = TOTALS[path] ?? 0;
  const page = Number(params?.page ?? 1);
  const perPage = Number(params?.per_page ?? 25);
  const search = (params?.search ?? '').toLowerCase();

  const offset = (page - 1) * perPage;
  const count = Math.max(0, Math.min(perPage, total - offset));

  let rows = Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    ...build(offset + i),
  }));

  // Lọc trong phạm vi trang hiện tại: đủ để thấy ô tìm kiếm có tác dụng,
  // backend thật sẽ lọc trên toàn bộ bảng rồi mới phân trang.
  if (search) {
    rows = rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search)),
    );
  }

  return { data: rows, meta: { current_page: page, per_page: perPage, total } };
}

/** Trả về response giả cho một request, hoặc null nếu không có tuyến khớp. */
function route(config) {
  const path = pathOf(config);
  const method = (config.method ?? 'get').toLowerCase();
  const params = config.params ?? {};

  if (path === '/auth/login') {
    // config.data là chuỗi JSON do axios đã tuần tự hoá
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});

    if (body.email !== DEMO_ACCOUNT.email || body.password !== DEMO_ACCOUNT.password) {
      return reject(config, 422, {
        message: 'Thông tin đăng nhập không đúng.',
        errors: { email: ['E-mail hoặc mật khẩu không đúng.'] },
      });
    }

    return respond(config, { token: DEMO_TOKEN, user: DEMO_USER });
  }

  if (path === '/auth/me') return respond(config, { user: DEMO_USER });
  if (path === '/auth/logout') return respond(config, null, 204);

  if (path === '/dashboard/summary') return respond(config, SUMMARY);

  if (path === '/notifications') {
    return method === 'get' ? respond(config, { data: NOTIFICATIONS }) : respond(config, null, 204);
  }
  if (path === '/notifications/read-all') {
    NOTIFICATIONS.forEach((item) => {
      item.readAt = item.readAt ?? new Date().toISOString();
    });
    SUMMARY.unreadNotifications = 0;
    return respond(config, null, 204);
  }

  if (path === '/settings') {
    return method === 'get' ? respond(config, SETTINGS) : respond(config, null, 204);
  }

  if (path === '/search') {
    return respond(config, { groups: SEARCH_GROUPS(params.q ?? '') });
  }

  const reportMatch = path.match(/^\/reports\/(d03|ar|d05|summary)$/);
  if (reportMatch) {
    const build = REPORT_ROWS[reportMatch[1]];
    const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, ...build(i) }));
    const amount = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
    return respond(config, { data: rows, totals: { count: rows.length, amount } });
  }

  if (path.endsWith('/import')) {
    return respond(config, {
      total: 142,
      imported: 139,
      errors: [
        { row: 17, message: 'Mã số BHXH không hợp lệ' },
        { row: 58, message: 'Thiếu nơi khám chữa bệnh ban đầu' },
        { row: 96, message: 'Mức đóng không khớp danh mục' },
      ],
    });
  }

  if (path.endsWith('/export')) {
    // Tệp giả để nút tải về vẫn hoạt động
    return respond(config, new Blob(['Dữ liệu demo'], { type: 'text/plain' }));
  }

  if (ROW_BUILDERS[path]) return respond(config, paginate(path, params));

  return null;
}

/**
 * Adapter cho axios: chặn mọi request và trả dữ liệu giả.
 * Tuyến chưa khai báo trả về 404 để lộ ra ngay chứ không im lặng.
 */
export default function demoAdapter(config) {
  return new Promise((resolve, rejectPromise) => {
    setTimeout(() => {
      const result = route(config);

      if (result === null) {
        reject(config, 404, { message: `Chế độ demo chưa mô phỏng ${pathOf(config)}` }).catch(
          rejectPromise,
        );
        return;
      }

      Promise.resolve(result).then(resolve, rejectPromise);
    }, LATENCY_MS);
  });
}

export { DEMO_ACCOUNT };
