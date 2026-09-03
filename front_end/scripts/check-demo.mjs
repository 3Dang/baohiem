import demoAdapter from '@/lib/demo/adapter';
import { endpoints } from '@/lib/endpoints';
import { ROW_BUILDERS } from '@/lib/demo/data';
import { exportParamsOf, filterParamsOf } from '@/features/resource/params';

/**
 * Kiểm tra chế độ demo bằng cách gọi thẳng adapter, không cần trình duyệt:
 * `npm run check:demo`
 *
 * Vì sao cần: mọi màn hình đọc dữ liệu qua adapter này, nên một bộ lọc khai trên
 * UI mà dữ liệu giả không có trường tương ứng sẽ "bấm được nhưng không lọc gì" —
 * đọc mã không thấy, chỉ chạy mới thấy. Script cũng là bản đặc tả sống của hợp
 * đồng API: mỗi khẳng định ở đây là một điều backend thật phải làm được.
 */

let failed = 0;

const ok = (condition, label, note = '') => {
  if (!condition) failed += 1;
  console.log(`${condition ? 'OK  ' : 'FAIL'} ${label}${note ? `  ${note}` : ''}`);
};

const section = (title) => console.log(`\n── ${title}`);

const call = (method, url, params = {}, extra = {}) =>
  demoAdapter({ method, url, params, baseURL: '', ...extra });

const get = (url, params) => call('get', url, params).then((res) => res.data);
const totalOf = (url, params) => get(url, params).then((data) => data.meta.total);

section('Mọi tuyến của endpoints.js đều có người trả lời');

const routes = [
  ['get', endpoints.auth.me],
  ['get', endpoints.dashboard.summary],
  ['get', endpoints.notifications.list],
  ...Object.values(endpoints.resources).flatMap((path) => [
    ['get', path, { page: 1, per_page: 5 }],
    ['get', `${path}/counts`],
    ['get', `${path}/ids`],
  ]),
  ...['d03', 'ar', 'd05'].flatMap((type) => [
    ['get', endpoints.declarations[type], { page: 1, per_page: 5 }],
    ['get', endpoints.reports[type], { page: 1, per_page: 5 }],
    ['get', endpoints.reportExtras(type).stats],
    ['get', endpoints.reportExtras(type).dateMismatch],
  ]),
  ['get', endpoints.reports.summary],
];

const missing = [];
for (const [method, url, params] of routes) {
  await call(method, url, params).catch((error) =>
    missing.push(`${error.response?.status ?? '?'} ${method.toUpperCase()} ${url}`),
  );
}
ok(missing.length === 0, `${routes.length} tuyến JSON`, missing.join(' · '));

section('Đường dẫn kết xuất trả về tệp');

/*
 * Nút xuất đi qua `downloadFile` với `responseType: 'blob'` nên phải thử đúng
 * kiểu đó: gọi như một request JSON thì adapter trả 404 và tưởng là lỗi thật.
 */
const exportRoutes = [
  ...['d03', 'ar', 'd05'].flatMap((type) => [
    endpoints.reports.export(type),
    endpoints.reports.statistics(type),
    endpoints.declarations[`${type}Export`],
  ]),
  endpoints.reports.summaryExport,
  endpoints.receiptBooks.returnReport,
  ...[
    endpoints.resources.receiptBooks,
    endpoints.resources.payments,
    endpoints.resources.receipts,
    endpoints.resources.insuranceReceipts,
  ].map((path) => `${path}/export`),
  endpoints.insuranceHistory.template,
];

for (const url of exportRoutes) {
  const res = await call('get', url, {}, { responseType: 'blob' }).catch((error) => error.response);
  ok(res?.status === 200, url, `→ ${res?.status}`);
}

section('Tham số kết xuất: bỏ trang, giữ bộ lọc và thứ tự sắp xếp');

const listParams = {
  page: 3,
  per_page: 25,
  search: 'Nguyễn',
  sort_by: 'amount',
  sort_dir: 'desc',
  from: '2026-09-01',
  status: 'approved',
  agentName: '',
};
const exportParams = exportParamsOf(listParams);

ok(!('page' in exportParams) && !('per_page' in exportParams), 'bỏ phân trang');
ok(exportParams.sort_by === 'amount' && exportParams.sort_dir === 'desc', 'giữ thứ tự sắp xếp');
ok(exportParams.search === 'Nguyễn' && exportParams.status === 'approved', 'giữ bộ lọc và từ khoá');
ok(!('agentName' in exportParams), 'bỏ ô lọc để trống');
ok(!('sort_by' in filterParamsOf(listParams)), 'filterParamsOf vẫn bỏ sắp xếp (cache /counts, /ids)');

section('Bộ lọc trên giao diện có thật sự thu hẹp kết quả');

/*
 * Bộ lọc nào cũng phải làm số dòng giảm đi. Không giảm nghĩa là dữ liệu không có
 * trường ấy: ô lọc vẫn bấm được, chọn xong bảng y nguyên — lỗi khó thấy nhất
 * trong cả trang vì không có thông báo nào.
 */
const narrows = async (label, url, narrowed, base = {}) => {
  const before = await totalOf(url, base);
  const after = await totalOf(url, { ...base, ...narrowed });
  ok(after < before, label, `${before} → ${after}`);
};

await narrows('reports/d03 · biên từ/đến', endpoints.reports.d03, {
  from: '2026-09-01',
  to: '2026-09-03',
});
await narrows('reports/d03 · duyệt từ/đến', endpoints.reports.d03, {
  approvedFrom: '2026-09-01',
  approvedTo: '2026-09-03',
});
await narrows('reports/d03 · giải pháp đóng', endpoints.reports.d03, { solution: 'yearly' });
await narrows('declarations/d03 · BC từ/đến', endpoints.declarations.d03, {
  reportFrom: '2026-09-01',
  reportTo: '2026-09-03',
});
await narrows('declarations/d05 · giải pháp đóng', endpoints.declarations.d05, {
  solution: 'quarterly',
});
await narrows('insurance-receipts · biên lai điện tử', endpoints.resources.insuranceReceipts, {
  type: 'electronic',
});
await narrows('receipts · tháng cấp lại', endpoints.resources.receipts, { month: '2026-09' });
await narrows(
  'receipt-books · ngày trả biên',
  endpoints.resources.receiptBooks,
  { returnedFrom: '2026-09-01' },
  { returnStatus: 'returned' },
);
await narrows('audit-logs · bảng dữ liệu', endpoints.resources.auditLogs, {
  tableName: 'payments',
});
await narrows('system-logs · mức độ', endpoints.resources.systemLogs, { level: 'error' });

section('Tab "Chưa trả" không bị bộ lọc mặc định làm rỗng');

// Quyển chưa trả thì không có ngày trả, nên đặt sẵn khoảng ngày trả mặc định sẽ
// làm rỗng đúng cái tab người dùng vào xem nhiều nhất
const pending = await get(`${endpoints.resources.receiptBooks}/counts`, {
  returnStatus: 'pending',
});
ok(pending.total > 0, 'quyển chưa trả vẫn hiện', `${pending.total} quyển`);

section('Dải tab cắt hết tập dữ liệu, không thừa không thiếu');

const historyCounts = async (params) =>
  (await get(`${endpoints.resources.insuranceHistory}/counts`, params)).total;

const allHistory = await historyCounts({});
const byType =
  (await historyCounts({ insuranceType: 'd03' })) + (await historyCounts({ insuranceType: 'd05' }));
const bySource =
  (await historyCounts({ source: 'import' })) + (await historyCounts({ source: 'system' }));

ok(byType === allHistory, 'chia theo loại bảo hiểm', `${byType} / ${allHistory}`);
ok(bySource === allHistory, 'chia theo nguồn dữ liệu', `${bySource} / ${allHistory}`);

section('Tra cứu ở Bảng điều khiển: ba loại là ba trường khác nhau');

const sample = (await get(endpoints.resources.insuranceHistory, { page: 1, per_page: 1 })).data[0];

for (const [type, value] of [
  ['cccd', sample.idNo],
  ['insurance_code', sample.insuranceNo],
  ['name', sample.fullName],
]) {
  const found = await get(endpoints.resources.insuranceHistory, {
    search: value,
    search_type: type,
  });
  ok(found.meta.total > 0, `tra theo ${type}`, `"${value}" → ${found.meta.total} dòng`);
}

// Ô tra cứu không có phân trang nhưng tra theo tên khớp rất nhiều người, nên
// response vẫn phải là một trang chứ không phải cả tập
const named = await get(endpoints.resources.insuranceHistory, {
  search: sample.fullName,
  search_type: 'name',
  per_page: 25,
});
ok(named.data.length <= 25, 'tra theo tên vẫn cắt trang', `${named.data.length} / ${named.meta.total}`);

section('Mọi bảng đều sắp xếp được theo cột của chính nó');

const unsortable = [];
for (const [path, build] of Object.entries(ROW_BUILDERS)) {
  const keys = Object.keys(build(0));
  const sorted = await get(path, { page: 1, per_page: 1, sort_by: keys[0], sort_dir: 'desc' });
  if (!sorted.data.length) unsortable.push(`${path} (${keys[0]})`);
}
ok(unsortable.length === 0, `${Object.keys(ROW_BUILDERS).length} bảng`, unsortable.join(' · '));

console.log(`\n${failed === 0 ? 'Tất cả kiểm tra đều đạt.' : `${failed} kiểm tra không đạt.`}`);
process.exit(failed === 0 ? 0 : 1);
