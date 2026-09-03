import { applyChanges, createRow, deleteRow, updateRow } from './store';
import {
  DEMO_ACCOUNT,
  DEMO_USER,
  NOTIFICATIONS,
  ROW_BUILDERS,
  SEARCH_GROUPS,
  SUMMARY,
  SUMMARY_REPORT,
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

/** Đọc body JSON mà axios đã tuần tự hoá thành chuỗi. */
const bodyOf = (config) =>
  typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});

/** Dòng nào chứa từ khoá ở bất kỳ trường nào. */
const matches = (row, term) =>
  Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term));

/**
 * Endpoint dùng chung dữ liệu với một endpoint khác.
 *
 * Trang báo cáo D03/AR/D05 nói về **chính** những hồ sơ đã kê khai, chỉ trình
 * bày khác (thêm ô số liệu, gom theo hộ). Trỏ về cùng một nguồn nên sửa một hồ
 * sơ ở trang nhập thì trang báo cáo thấy ngay, không phải đồng bộ hai bản.
 */
const SOURCE_ALIASES = {
  '/reports/d03': '/declarations/d03',
  '/reports/ar': '/declarations/ar',
  '/reports/d05': '/declarations/d05',
};

const sourceOf = (path) => SOURCE_ALIASES[path] ?? path;

/** Toàn bộ dòng của một endpoint, đã tính cả thao tác thêm/sửa/xoá trong phiên. */
function rowsOf(path) {
  const source = sourceOf(path);
  return applyChanges(source, ROW_BUILDERS[source], TOTALS[source] ?? 0);
}

/** Loại tra cứu ở Bảng điều khiển → trường dữ liệu tương ứng. */
const SEARCH_FIELDS = {
  cccd: 'idNo',
  insurance_code: 'insuranceNo',
  name: 'fullName',
};

/** Tham số điều khiển truy vấn, không phải điều kiện lọc dữ liệu. */
const CONTROL_PARAMS = new Set([
  'page',
  'per_page',
  'search',
  'search_type',
  'sort_by',
  'sort_dir',
]);

/**
 * Ánh xạ tên tham số lọc → cách đọc giá trị từ một dòng.
 * Không khai báo ở đây thì adapter so khớp thẳng theo tên trường cùng tên.
 */
const FILTER_FIELDS = {
  month: null,
  recent: null,
  agentName: (row) => row.agentName,
  districtName: (row) => row.districtName,
};

/**
 * Bộ lọc chọn từ danh mục gửi lên **id** (ô chọn lấy `value` là id), còn dòng
 * dữ liệu giả chỉ lưu tên. Tra ngược id → tên để những bộ lọc đó lọc được thật;
 * backend thật so khớp bằng khoá ngoại nên không cần bước này.
 */
const LOOKUP_FILTERS = {
  wardName: '/wards',
  districtName: '/districts',
  provinceName: '/provinces',
  agentName: '/agents',
};

/**
 * Quy đổi id trong tham số lọc thành tên, **một lần cho cả truy vấn**. Làm việc
 * này bên trong vòng lặp từng dòng sẽ quét lại cả danh mục cho mỗi dòng — với
 * bảng hàng trăm nghìn dòng thì không dùng được.
 */
function resolveParams(params = {}) {
  const resolved = {};

  Object.entries(params).forEach(([key, value]) => {
    const catalog = LOOKUP_FILTERS[key];

    if (catalog && /^\d+$/.test(String(value))) {
      const row = rowsOf(catalog).find((item) => String(item.id) === String(value));
      resolved[key] = row?.name ?? value;
      return;
    }

    resolved[key] = value;
  });

  return resolved;
}

/** Mốc thời gian chính của một dòng, dùng cho cặp điều kiện `from`/`to`. */
const dateOf = (row) =>
  row.issuedAt ?? row.paidAt ?? row.submittedAt ?? row.createdAt ?? row.effectiveFrom;

/**
 * Các cặp lọc theo khoảng ngày: tham số → mốc thời gian tương ứng của dòng.
 *
 * Một trang lọc theo nhiều mốc khác nhau nên mỗi cặp phải nói rõ nó so trên
 * trường nào: trang báo cáo có "biên từ/đến" (ngày ghi trên biên lai) và "duyệt
 * từ/đến" (ngày cơ quan BHXH duyệt), trang xuất hồ sơ thêm "BC từ/đến" (ngày
 * đưa hồ sơ vào bản kê gửi đi) — ba mốc của cùng một hồ sơ.
 */
const DATE_RANGES = {
  from: [dateOf, 'min'],
  to: [dateOf, 'max'],
  approvedFrom: [(row) => row.approvedAt, 'min'],
  approvedTo: [(row) => row.approvedAt, 'max'],
  reportFrom: [(row) => row.reportDate, 'min'],
  reportTo: [(row) => row.reportDate, 'max'],
  returnedFrom: [(row) => row.returnedAt, 'min'],
  returnedTo: [(row) => row.returnedAt, 'max'],
};

/**
 * Một dòng có nằm trong khoảng ngày của điều kiện không.
 *
 * Bảng không có mốc này (`undefined`) thì bỏ qua điều kiện — cùng một bộ lọc
 * dùng cho nhiều bảng. Có mốc nhưng để trống thì **không** thoả: "duyệt từ ngày
 * X" nói về hồ sơ đã duyệt, hồ sơ chưa duyệt không thuộc kết quả.
 */
function inDateRange(row, [read, bound], value) {
  const at = read(row);
  if (at === undefined) return true;
  if (!at) return false;

  return bound === 'min' ? at.slice(0, 10) >= value : at.slice(0, 10) <= value;
}

/** Một dòng có thoả toàn bộ điều kiện lọc không (tham số đã qua `resolveParams`). */
function passesFilters(row, params) {
  return Object.entries(params).every(([key, value]) => {
    if (CONTROL_PARAMS.has(key) || value === '' || value == null) return true;

    const range = DATE_RANGES[key];
    if (range) return inDateRange(row, range, value);

    if (key === 'month') return String(row.reissueMonth ?? '') === String(value);

    // Tab "7 ngày gần đây": lọc theo số ngày tính từ hôm nay
    if (key === 'recent') {
      const at = row.createdAt ?? dateOf(row);
      return !at || Date.now() - new Date(at).getTime() <= Number(value) * 86_400_000;
    }

    const read = FILTER_FIELDS[key];
    const actual = read ? read(row) : row[key];

    // Trường không tồn tại trong dự liệu giả thì bỏ qua điều kiện
    return actual == null ? true : String(actual) === String(value);
  });
}

/**
 * Sắp xếp theo cột người dùng chọn. So sánh số bằng phép trừ, còn lại so chuỗi
 * theo `localeCompare` để dấu tiếng Việt xếp đúng thứ tự bảng chữ cái.
 */
function sortRows(rows, sortBy, sortDir = 'asc') {
  if (!sortBy) return rows;

  const sign = sortDir === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];

    if (left == null) return 1;
    if (right == null) return -1;
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * sign;

    return String(left).localeCompare(String(right), 'vi') * sign;
  });
}

/** Lọc theo bộ lọc + từ khoá rồi sắp xếp — phần dùng chung của mọi truy vấn. */
function queryRows(path, params = {}) {
  const filters = resolveParams(params);
  const search = String(params.search ?? '').trim().toLowerCase();

  let rows = rowsOf(path).filter((row) => passesFilters(row, filters));
  if (search) rows = rows.filter((row) => matches(row, search));

  return sortRows(rows, params.sort_by, params.sort_dir);
}

/** Cộng các cột số của cả tập kết quả, cho dòng TỔNG CỘNG. */
const totalsOf = (rows) => ({
  count: rows.length,
  amount: rows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
  subsidy: rows.reduce((sum, row) => sum + (row.subsidy ?? 0), 0),
  employeeAmount: rows.reduce((sum, row) => sum + (row.employeeAmount ?? 0), 0),
  interest: rows.reduce((sum, row) => sum + (row.interest ?? 0), 0),
});

/** Lọc theo bộ lọc + từ khoá, sắp xếp rồi cắt trang — như backend thật. */
function paginate(path, params = {}) {
  const page = Number(params.page ?? 1);
  const perPage = Number(params.per_page ?? 25);
  const rows = queryRows(path, params);
  const offset = (page - 1) * perPage;

  return {
    data: rows.slice(offset, offset + perPage),
    meta: { current_page: page, per_page: perPage, total: rows.length },
    // Tổng của cả tập kết quả (dòng TỔNG CỘNG), không chỉ trang đang xem
    totals: totalsOf(rows),
  };
}

/**
 * Số bản ghi khớp điều kiện — con số hiện trên từng tab.
 *
 * Chỉ trả `total`, không trả dòng nào: mỗi tab là một tổ hợp điều kiện riêng
 * (loại bảo hiểm, nguồn dữ liệu, khoảng thời gian) nên không gộp được thành một
 * câu GROUP BY theo một trường duy nhất như dải tab một chiều.
 */
const countBy = (path, params = {}) => ({ total: queryRows(path, params).length });

/** Trả về response giả cho một request, hoặc null nếu không có tuyến khớp. */
function route(config) {
  const path = pathOf(config);
  const method = (config.method ?? 'get').toLowerCase();
  const params = config.params ?? {};

  // Mọi yêu cầu tải tệp nhận một tệp giả, nhờ vậy nút kết xuất ở trang nào cũng
  // bấm được — không phải khai báo riêng từng đường dẫn xuất Excel
  if (config.responseType === 'blob') {
    return respond(config, new Blob(['Dữ liệu demo'], { type: 'text/plain' }));
  }

  if (path === '/auth/login') {
    const body = bodyOf(config);

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

  if (path === '/search') {
    return respond(config, { groups: SEARCH_GROUPS(params.q ?? '') });
  }

  // Báo cáo tổng hợp có hai bảng (D03 và D05) nên khuôn dữ liệu khác các báo cáo đơn
  if (path === '/reports/summary') return respond(config, SUMMARY_REPORT());

  /*
   * Dải ô số liệu của trang báo cáo. Tách khỏi danh sách vì các con số nói về
   * hôm nay / hôm qua / toàn bộ kỳ, không phụ thuộc trang hay bộ lọc thời gian
   * người dùng đang chọn — trộn vào response danh sách thì đổi trang là tính lại.
   */
  const statsMatch = path.match(/^\/reports\/(d03|ar|d05)\/stats$/);
  if (statsMatch) {
    const rows = rowsOf(`/reports/${statsMatch[1]}`);
    const on = (row, date) => (dateOf(row) ?? '').slice(0, 10) === date;
    const dayISO = (offset) =>
      new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);

    const today = rows.filter((row) => on(row, dayISO(0)));
    const yesterday = rows.filter((row) => on(row, dayISO(1)));
    const isPending = (row) => !row.approvedAt;

    return respond(config, {
      todayPending: today.filter(isPending).length,
      todayApproved: today.length - today.filter(isPending).length,
      todayTotal: today.length,
      yesterdayPending: yesterday.filter(isPending).length,
      totalPending: rows.filter(isPending).length,
    });
  }

  /*
   * Hồ sơ có ngày trên tệp nhập lệch với ngày biên lai. Trả cả danh sách (số
   * lượng ít) để khối gập hiện thẳng, không phải phân trang thêm một lần nữa.
   */
  const mismatchMatch = path.match(/^\/reports\/(d03|ar|d05)\/date-mismatch$/);
  if (mismatchMatch) {
    const rows = rowsOf(`/reports/${mismatchMatch[1]}`).filter((row) => row.importDate);
    return respond(config, { data: rows.slice(0, 20), meta: { total: rows.length } });
  }

  const reportMatch = path.match(/^\/reports\/(d03|ar|d05)$/);
  if (reportMatch && method === 'get') return respond(config, paginate(path, params));

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


  /*
   * Tra cứu từ Bảng điều khiển: lọc trên **đúng một** trường của loại tìm kiếm.
   * Ba loại là ba trường khác nhau — tra theo CCCD mà so với mã số BHXH thì
   * không bao giờ ra kết quả.
   */
  if (path === '/insurance-history' && params.search_type) {
    const term = String(params.search ?? '').trim().toLowerCase();
    const field = SEARCH_FIELDS[params.search_type] ?? 'insuranceNo';
    const rows = rowsOf(path).filter((row) =>
      String(row[field] ?? '').toLowerCase().includes(term),
    );

    // Vẫn cắt trang dù ô tra cứu không có phân trang: tra theo tên có thể khớp
    // hàng nghìn người, trả hết về thì trình duyệt phải dựng hàng nghìn dòng
    const perPage = Number(params.per_page ?? 25);

    return respond(config, {
      data: rows.slice(0, perPage),
      meta: { current_page: 1, per_page: perPage, total: rows.length },
    });
  }

  // Chọn tất cả kết quả khớp bộ lọc: chỉ trả mảng id nên nhẹ hơn tải cả bản ghi
  const idsMatch = path.match(/^((?:\/[a-z0-9-]+)+)\/ids$/);
  if (idsMatch && ROW_BUILDERS[sourceOf(idsMatch[1])] && method === 'get') {
    return respond(config, { ids: queryRows(idsMatch[1], params).map((row) => row.id) });
  }

  // Số bản ghi khớp bộ lọc, không kèm dòng nào — con số trên mỗi tab
  const countsMatch = path.match(/^((?:\/[a-z0-9-]+)+)\/counts$/);
  if (countsMatch && ROW_BUILDERS[sourceOf(countsMatch[1])] && method === 'get') {
    return respond(config, countBy(countsMatch[1], params));
  }

  // Đưa một tham số cấu hình về giá trị mặc định: bỏ patch đang lưu của dòng đó
  const resetMatch = path.match(/^((?:\/[a-z0-9-]+)+)\/(\d+)\/reset$/);
  if (resetMatch && ROW_BUILDERS[resetMatch[1]] && method === 'post') {
    const id = Number(resetMatch[2]);
    const original = ROW_BUILDERS[resetMatch[1]](id - 1);
    return respond(config, updateRow(resetMatch[1], id, original));
  }

  // Thêm / sửa / xoá một bản ghi: `/base-salaries`, `/base-salaries/12`
  // hoặc `/declarations/d03/7` (collection nhiều đoạn)
  const [, path0, id] = path.match(/^((?:\/[a-z0-9-]+)+?)(?:\/(\d+))?$/) ?? [];
  // Sửa một dòng ở trang báo cáo là sửa chính hồ sơ đã kê khai, không phải
  // một bản sao — nên ghi vào đúng nguồn của endpoint đó
  const collection = path0 && sourceOf(path0);

  if (collection && ROW_BUILDERS[collection]) {
    if (method === 'post') return respond(config, createRow(collection, bodyOf(config)), 201);
    if (id && (method === 'put' || method === 'patch')) {
      return respond(config, updateRow(collection, Number(id), bodyOf(config)));
    }
    if (id && method === 'delete') {
      deleteRow(collection, Number(id));
      return respond(config, null, 204);
    }
    if (!id && method === 'get') return respond(config, paginate(collection, params));
  }

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
