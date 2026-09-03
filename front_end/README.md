# Baohiem Admin — Frontend

Giao diện quản trị hệ thống bảo hiểm (BHXH/BHYT tự nguyện): quản lý biên lai, thu –
nộp tiền, danh mục hành chính, kê khai D03/D05/AR và báo cáo.

Đây **chỉ là phần frontend**. Toàn bộ dữ liệu lấy qua REST API của backend.

## Công nghệ

| Thành phần | Lựa chọn | Lý do |
| --- | --- | --- |
| Build | Vite 5 | dev server nhanh, cấu hình proxy đơn giản |
| UI | React 18 + Tailwind CSS 3 | không phụ thuộc UI kit, giao diện gọn và nhất quán |
| Điều hướng | React Router 6 (data router) | route lồng nhau, layout dùng chung |
| Dữ liệu server | TanStack Query 5 | cache, phân trang, tự quản trạng thái tải/lỗi |
| HTTP | Axios | interceptor gắn token và chuẩn hoá lỗi |

## Chạy dự án

```bash
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

Các lệnh khác: `npm run build` (đóng gói vào `dist/`), `npm run preview`, `npm run lint`,
`npm run check:demo` (kiểm tra chế độ demo, xem mục dưới).

## Chế độ demo (chưa có backend)

Mặc định `.env.example` bật `VITE_DEMO_MODE=true`: một adapter axios trả dữ liệu
giả ngay trong trình duyệt, nên xem được toàn bộ giao diện mà không cần API.

Tài khoản dùng thử — trang đăng nhập điền sẵn, chỉ cần bấm nút:

```
admin@baohiem.vn / admin123
```

Dữ liệu giả nằm ở [src/lib/demo/](src/lib/demo/) và **chỉ được nạp khi biến này bật**.
Khi API thật sẵn sàng: đặt `VITE_DEMO_MODE=false`, trỏ `VITE_PROXY_TARGET` về backend
rồi khởi động lại dev server. Mã nghiệp vụ không thay đổi dòng nào vì adapter chỉ
thay tầng vận chuyển của axios. Muốn dọn hẳn thì xoá thư mục `src/lib/demo/` cùng
hai dòng tham chiếu trong [src/lib/http.js](src/lib/http.js).

Giới hạn cần biết: thao tác thêm/sửa/xoá chỉ được giữ trong bộ nhớ
([src/lib/demo/store.js](src/lib/demo/store.js)) nên mất khi tải lại trang.
Việc lọc tìm kiếm đã đúng thứ tự như backend thật — lọc toàn bảng rồi mới cắt trang.

### Kiểm tra chế độ demo

```bash
npm run check:demo
```

Gọi thẳng adapter demo bằng Node (không cần trình duyệt) và khẳng định từng điều mà
giao diện đang trông cậy: mọi tuyến trong `endpoints.js` có người trả lời, mọi đường
dẫn kết xuất trả về tệp, **mỗi ô lọc thật sự làm số dòng giảm đi**, dải tab cắt vừa
đúng cả tập, ba kiểu tra cứu ở Bảng điều khiển so trên ba trường khác nhau.

Ô lọc không lọc được gì là lỗi khó thấy nhất của trang danh sách — chọn xong bảng y
nguyên, không thông báo nào — nên nó được kiểm bằng cách chạy, không bằng cách đọc.
Script cũng là đặc tả sống của hợp đồng API: mỗi khẳng định là một điều backend thật
phải làm được. Xem [scripts/check-demo.mjs](scripts/check-demo.mjs).

## Cấu trúc mã nguồn

```
src/
├─ app/router.jsx          # khai báo toàn bộ route
├─ components/
│  ├─ layout/              # AdminLayout, Sidebar, Topbar, PageHeader
│  └─ ui/                  # Button, Field, DataTable, Pagination, Toast…
├─ config/navigation.js    # cấu trúc menu + quyền + badge số lượng
├─ features/               # tách theo nghiệp vụ
│  ├─ auth/                # AuthContext, LoginPage, ProtectedRoute
│  ├─ resource/            # ResourceListPage + các hook dùng chung
│  ├─ catalog/             # danh mục hành chính & nghiệp vụ
│  ├─ declarations/        # nhập / xuất D03, D05, AR
│  ├─ reports/             # báo cáo theo kỳ + báo cáo tổng hợp
│  └─ …
└─ lib/
   ├─ demo/                # dữ liệu giả cho chế độ demo (xoá được)
   └─ …                    # http, endpoints, download, format, hooks

scripts/                   # kiểm tra chế độ demo bằng Node (npm run check:demo)
```

Nguyên tắc: **`components/` không biết gì về nghiệp vụ**, `features/` mới chứa
logic nghiệp vụ, `lib/endpoints.js` là nơi duy nhất khai báo đường dẫn API.

## Hợp đồng API với backend

Base URL lấy từ `VITE_API_BASE_URL` (mặc định `/api`). Danh sách đầy đủ đường dẫn
xem tại [src/lib/endpoints.js](src/lib/endpoints.js).

### Xác thực

Bearer token gửi ở header `Authorization`, lưu tại `localStorage`.

```
POST /auth/login   { email, password, remember }  → { token, user }
GET  /auth/me                                     → { user }
POST /auth/logout                                 → 204
```

`user` gồm `{ id, name, email, permissions: string[] }`. Mảng `permissions`
quyết định mục menu nào được hiện — xem `permission` trong
[src/config/navigation.js](src/config/navigation.js).

Nhận `401` ở bất kỳ request nào, frontend tự xoá token và chuyển về `/login`.

### Danh sách phân trang

Mọi trang danh sách gửi `?page=&per_page=&search=&sort_by=&sort_dir=` và mong đợi
khuôn paginator của Laravel:

```json
{
  "data": [ /* … */ ],
  "meta": { "current_page": 1, "per_page": 25, "total": 143 },
  "totals": { "count": 143, "amount": 70598385 }
}
```

Tìm kiếm phải lọc trên toàn bộ bảng rồi mới phân trang, không lọc trong phạm vi trang.
Sắp xếp cũng vậy — `sort_by` là khoá cột, `sort_dir` là `asc`/`desc`; frontend không tự
sắp xếp vì nó chỉ nắm một trang.

`totals` là số liệu của **cả tập kết quả sau khi lọc**, dùng cho dòng *TỔNG CỘNG* ở
chân bảng (trang Xuất D03/AR/D05). Không có khoá này thì bảng chỉ bỏ dòng tổng, các
phần khác vẫn chạy.

### Bộ lọc, chọn nhiều dòng, công tắc trạng thái

Trang khai báo `filterFields` sẽ gửi thêm điều kiện lọc vào query string, chỉ những
điều kiện có giá trị:

```
GET /<endpoint>?page=&per_page=&search=&from=&to=&status=&agentName=…
```

Backend lọc toàn bảng theo điều kiện rồi mới phân trang; `meta.total` là tổng sau khi
lọc. Khoảng ngày dạng `yyyy-MM-dd`, tháng dạng `yyyy-MM`.

Một bản ghi có nhiều mốc thời gian, nên tham số ngày mang tên của mốc nó so — không
dùng chung `from`/`to` cho tất cả:

| Cặp tham số | Mốc trên bản ghi | Trang dùng |
| --- | --- | --- |
| `from` / `to` | ngày ghi trên biên lai (hoặc ngày tạo, tuỳ bảng) | mọi trang danh sách |
| `approvedFrom` / `approvedTo` | ngày cơ quan BHXH duyệt | báo cáo D03/AR/D05 |
| `reportFrom` / `reportTo` | ngày đưa hồ sơ vào bản kê gửi đi | xuất D03/AR/D05 |
| `returnedFrom` / `returnedTo` | ngày đại lý trả biên | quản lý quyển |

Quy tắc với bản ghi chưa có mốc đó: điều kiện `approvedFrom` **loại** hồ sơ chưa
duyệt — "duyệt từ ngày X" nói về hồ sơ đã duyệt. Bảng nào không có mốc ấy thì bỏ qua
điều kiện, nhờ vậy cùng một bộ lọc dùng được cho nhiều bảng.

Hai tham số lọc không phải ngày cũng cần nói rõ: `solution` là kỳ đóng
(`monthly` / `quarterly` / `yearly`, khớp cột *Tháng/Mức*), `type=electronic` tách
biên lai điện tử khỏi biên lai giấy — trang *Biên lai điện tử* chính là
`/insurance-receipts` lọc theo tham số này.

Dải tab lọc nhanh (*All / Chưa trả / Đã trả* ở trang Quản lý quyển) cũng chỉ là một
điều kiện lọc nữa — tab đang chọn được gửi kèm như mọi tham số khác
(`?returnStatus=pending`), tab đầu tiên mang giá trị rỗng nghĩa là không lọc. Trường
nào đã do dải tab điều khiển thì thanh bộ lọc không có ô cho nó nữa: hai chỗ cùng đặt
một điều kiện thì chip bộ lọc sẽ ghi một điều kiện khác với điều kiện bảng đang lọc.

Tab hiện được **số bản ghi** của tập con thì cần thêm một đường dẫn chỉ đếm:

```
GET /<endpoint>/counts?<điều kiện của tab, không có page/per_page>
    → { total: 38410 }
```

Một request cho mỗi tab (chạy song song, cache 60 giây) vì các tab không nhất thiết
cắt theo cùng một trường: dải tab của *Lịch sử bảo hiểm* chia theo loại bảo hiểm
(`insuranceType`), theo nguồn dữ liệu (`source`) và theo số ngày gần đây (`recent=7`)
— ba chiều khác nhau của cùng một tập. Thiếu đường dẫn này thì tab vẫn hoạt động, chỉ
không kèm số.

Công tắc ở cột *Hoạt động* gửi đúng một trường thay đổi để không ghi đè các trường
bảng không hiển thị:

```
PATCH /<endpoint>/{id}   { isActive: true }
```

Chọn nhiều dòng có hai mức. Checkbox đầu bảng chỉ chọn các dòng trong trang đang xem;
liên kết *Chọn tất cả N kết quả* chọn mọi bản ghi khớp bộ lọc, kể cả ở trang khác.
Vì trình duyệt chỉ nắm một trang, mức thứ hai cần một đường dẫn trả về danh sách id:

```
GET /<endpoint>/ids?<cùng điều kiện lọc, không có page/per_page>
    → { ids: [1, 2, 3, …] }
```

Chỉ trả mảng id (không trả cả bản ghi) để chọn vài nghìn dòng vẫn nhẹ. Nếu backend
chưa có đường dẫn này, chức năng chọn theo trang vẫn hoạt động bình thường, chỉ liên
kết *Chọn tất cả* báo lỗi bằng toast.

Xoá hàng loạt gọi `DELETE /<endpoint>/{id}` song song cho từng id đã chọn; một id
thất bại không chặn những id còn lại, số bản ghi trượt được báo lại cho người dùng.

### Kết xuất

Mỗi danh sách có một đường dẫn xuất tệp suy ra từ đường dẫn danh sách, nhận **đúng bộ
lọc đang áp dụng cộng thứ tự sắp xếp**, bỏ phân trang:

```
GET /<endpoint>/export?search=&sort_by=&sort_dir=&<điều kiện lọc>   → tệp nhị phân
```

Giữ `sort_by`/`sort_dir` (khác `/counts` và `/ids` — hai đường dẫn đó bỏ) vì tệp phải
xếp theo đúng thứ tự bảng đang hiện: bản kê D03 gom theo mã hộ chỉ đúng khi các dòng
cùng hộ nằm liền nhau, và người mở tệp mong thấy thứ tự giống trên màn hình.

Xuất các dòng người dùng tự tay chọn thì gửi id thay cho bộ lọc:

```
GET /<endpoint>/export?ids=1,2,3   → tệp chỉ chứa các dòng đó
```

Ba tệp không suy ra được từ đường dẫn danh sách:

```
GET /receipt-books/return-report?returnStatus=returned|pending&<bộ lọc>
    → biên bản trả quyển (văn bản có ký nhận, khác bản kê dữ liệu)
GET /reports/summary/export?sheet=d03|d05&<bộ lọc>
    → báo cáo tổng hợp có hai bảng trong một response nên phải nói rõ xuất bảng nào
GET /insurance-history/template → tệp Excel mẫu để nhập lịch sử
```

Tên tệp lấy từ header `Content-Disposition`; không có thì frontend tự đặt theo tên
nghiệp vụ kèm ngày hôm nay.

### Thêm / sửa / xoá bản ghi

Trang danh sách nào khai báo `formFields` sẽ bật sẵn CRUD trên chính bảng đó
(nút *Thêm mới*, biểu tượng sửa/xoá ở mỗi dòng) và gọi ba đường dẫn REST
suy ra từ endpoint của danh sách:

```
POST   /<endpoint>        { … } → bản ghi vừa tạo (201)
PUT    /<endpoint>/{id}   { … } → bản ghi sau khi sửa
DELETE /<endpoint>/{id}         → 204
```

Ô số gửi lên dạng số, ô không bắt buộc để trống gửi `null` (không phải chuỗi rỗng),
ví dụ `effectiveTo` rỗng nghĩa là mốc đang áp dụng. Lỗi `422` được gắn vào đúng field
theo tên. Sau mỗi lần thành công frontend tự tải lại danh sách.

### Tra cứu thông tin bảo hiểm (Bảng điều khiển)

```
GET /insurance-history?search=&search_type=cccd|insurance_code|name
    → { data: […], meta: { current_page, per_page, total } }
```

Frontend đã kiểm định dạng trước khi gọi: CCCD 9 hoặc 12 chữ số, mã BHXH đúng 10
chữ số, tìm theo tên tối thiểu 2 ký tự.

### Lỗi validate

Trả `422` theo chuẩn Laravel; frontend tự gắn thông báo vào đúng field:

```json
{ "message": "Dữ liệu không hợp lệ.", "errors": { "email": ["Email không tồn tại."] } }
```

### Số liệu tổng quan

Một endpoint duy nhất phục vụ cả dashboard, badge sidebar và số thông báo chưa đọc:

```
GET /dashboard/summary → {
  stats: { receiptsThisMonth, revenueThisMonth, activePolicies, pendingDeclarations },
  recentActivities: [{ id, action, actor, createdAt }],
  badges: { provinces: 34, districts: 143, wards: 0, hamlets: 9422, … },
  unreadNotifications: 0
}
```

Khoá trong `badges` khớp với `countKey` khai báo ở `navigation.js`.

### Nhập / xuất hồ sơ kê khai

Mỗi mẫu biểu có hai trang: trang **nhập** là một danh sách CRUD bình thường trên
`/declarations/{d03|ar|d05}`, trang **xuất** là cùng danh sách đó với bộ lọc ba khối
rồi kết xuất ra tệp.

```
GET  /declarations/{d03|ar|d05}          # danh sách, như mọi endpoint phân trang
POST /declarations/{d03|d05|ar}/import   multipart, field `file`
     → { total, imported, errors: [{ row, message }] }

GET  /declarations/{d03|d05|ar}/export   # kết xuất, theo mục Kết xuất ở trên
```

Trang Xuất D03 gom dòng theo `householdNo` (mã hộ). Việc gom do frontend làm trên các
dòng liền nhau, nên **backend phải trả các dòng cùng một hộ cạnh nhau** — mặc định
`sort_by=householdNo` đã đủ, và vì `/export` giữ `sort_by` nên tệp cũng gom đúng.

Trang *Lịch sử bảo hiểm* cũng có hai việc theo lô riêng:

```
POST /insurance-history/import     multipart, field `file` (Import Timeline)
GET  /insurance-history/template   → tệp Excel mẫu
```

### Báo cáo

Ba trang báo cáo (D03 / AR / D05) đọc **chính** tập hồ sơ đã kê khai, chỉ trình bày
khác, nên dùng lại khuôn danh sách phân trang kèm `totals`:

```
GET /reports/{d03|ar|d05}?page=&per_page=&search=&sort_by=&sort_dir=
      &from=&to=&approvedFrom=&approvedTo=&wardName=&agentName=&status=&solution=
    → { data: [...], meta: {...}, totals: { count, amount, employeeAmount, interest } }
```

`from`/`to` lọc theo ngày ghi trên biên lai, `approvedFrom`/`approvedTo` theo ngày cơ
quan BHXH duyệt — hai mốc khác nhau và đều cần thiết. Sửa một dòng gọi
`PUT /reports/{type}/{id}`; trang không tạo mới và không xoá vì hồ sơ đến từ trang nhập
hoặc tệp Excel.

Hai truy vấn phụ, tách riêng vì nói về cả kỳ chứ không về trang đang xem:

```
GET /reports/{d03|ar|d05}/stats
    → { todayPending, todayApproved, todayTotal, yesterdayPending, totalPending }

GET /reports/{d03|ar|d05}/date-mismatch
    → { data: [{ fullName, insuranceNo, receiptDate, importDate, agentName }],
        meta: { total } }
```

`stats` là năm ô số liệu ở đầu trang: "chưa duyệt" nghĩa là `approvedAt` rỗng. Không
nhận bộ lọc — các con số nói về hôm nay và hôm qua, còn bộ lọc nói về kỳ người dùng
đang xem; gộp lại thì mỗi lần đổi khoảng ngày phải tính lại những số vốn không đổi.

`date-mismatch` là hồ sơ có ngày trên tệp nhập từ cổng BHXH lệch với ngày biên lai —
phải sửa trước khi kết xuất để cơ quan BHXH không trả hồ sơ. Số lượng ít nên trả thẳng
danh sách, không phân trang.

Kết xuất dùng chung hai đường dẫn, cả hai nhận điều kiện như mục *Kết xuất* ở trên:

```
GET /reports/{type}/export      → tệp báo cáo
GET /reports/{type}/statistics  → tệp thống kê (cùng bộ lọc, khác cách trình bày)
```

Báo cáo tổng hợp có khuôn riêng vì gồm hai bảng:

```
GET /reports/summary?wardName=&from=&to=&form=&status=
    → { d03: { data: [...], totals: {...} },
        d05: { data: [...], totals: {...} } }
```

Mỗi dòng gồm `collaboratorName`, `employeeCode`, `total`, các cặp
`months{1,3,6,12}` / `months{1,3,6,12}Amount`, rồi `revenue`, `paid`, `diff`.
`totals` là dòng *TỔNG CỘNG* do backend cộng trên cả kỳ (không cộng tại client vì
báo cáo có thể phân trang về sau).

### Cài đặt

Hai trang khác nhau, đừng lẫn:

`/settings` là **tham số tính toán** dạng khoá/giá trị (thêm/sửa/xoá được từng dòng),
theo đúng khuôn danh sách phân trang ở trên, mỗi dòng `{ id, key, value, description }`.

`/system-settings` là **tham số vận hành**, cũng là một danh sách nhưng mỗi dòng có
danh mục và kiểu dữ liệu:

```
{ id, category, key, label, valueType: 'number'|'boolean'|'string',
  value, isSystem, isActive, updatedAt }
```

`isSystem` là tham số do hệ thống quản lý: sửa được nhưng không nên xoá, nên trang có
thêm hành động đưa về giá trị mặc định:

```
POST /system-settings/{id}/reset → bản ghi sau khi đặt lại
```

## Trang danh sách dùng chung

[ResourceListPage](src/features/resource/ResourceListPage.jsx) lo sẵn breadcrumb, tìm
kiếm, bộ lọc, sắp xếp, phân trang, chọn dòng và CRUD. Trang mới chỉ khai báo phần khác
biệt:

| Prop | Bật thêm gì |
| --- | --- |
| `endpoint`, `columns` | bắt buộc — cột đặt `sortable: true` là bấm sắp xếp được |
| `formFields` | nút *Tạo mới*, liên kết *Chỉnh sửa*/*Xoá* mỗi dòng, xoá hàng loạt |
| `creatable`, `deletable` | tắt riêng *Tạo mới* / xoá khi trang chỉ sửa bản ghi có sẵn |
| `filterFields` | thanh bộ lọc + chip điều kiện; `group` gom thành khối nền xanh |
| `deferFilters` | bộ lọc phải bấm *Áp dụng* mới truy vấn (dùng cho truy vấn nặng) |
| `tabs` | dải tab lọc nhanh; `counted: true` để mỗi tab hiện số bản ghi |
| `rowActions` | gom hành động của dòng vào menu *Thao tác* (bảng nhiều cột) |
| `bulkActions` | nút riêng trong thanh hành động hàng loạt |
| `actions`, `toolbar` | nút của trang; nhận hàm để lấy điều kiện lọc (xem dưới) |
| `groupBy`, `footerRow` | gom dòng theo nhóm và dòng *TỔNG CỘNG* |
| `sortOptions` | cặp ô chọn *Sắp xếp theo / Tăng dần* cạnh ô tìm kiếm |
| `stats`, `panels` | dải ô số liệu và khối gập trước bảng, do trang cha dựng |
| `perPage`, `sortBy` | số dòng và cột sắp xếp mặc định |

Cột checkbox và bộ chọn cột hiển thị luôn có mặt, không cần khai báo.

`actions` và `toolbar` nhận `ReactNode` như thường, hoặc một hàm khi nút cần biết bảng
đang lọc theo gì — điều kiện đó chỉ có bên trong `ResourceListPage`:

```jsx
actions={({ exportParams }) => (
  <ExportButton endpoint={`${endpoint}/export`} params={exportParams} fileBaseName="D03" />
)}
```

`exportParams` là bộ lọc + từ khoá + thứ tự sắp xếp đang áp dụng, đã bỏ phân trang, nên
tệp tải về khớp với những gì đang thấy trên màn hình. Nút nào tự chốt một điều kiện
riêng thì trộn thêm vào (`{ ...exportParams, returnStatus: 'returned' }`) — nhãn nút đã
nói rõ xuất tập nào thì nó phải thắng tab đang chọn.

Hành động hàng loạt kết xuất thì đi theo `ids` thay cho bộ lọc, và khai `keepSelection`
để lựa chọn còn đó sau khi tải tệp (kết xuất chỉ đọc, thường phải xuất tiếp mẫu khác):

```jsx
{ key: 'export', label: 'Xuất các dòng đã chọn', keepSelection: true,
  onRun: (ids) => downloadExport(`${endpoint}/export`, { params: { ids: ids.join(',') },
                                                        fileBaseName: 'BienLaiDaChon' }) }
```

Tab thường chỉ chọn giá trị cho một trường (`tabs.name`); khi dải tab cắt dữ liệu theo
nhiều chiều thì mỗi tab khai `filters` riêng:

```jsx
tabs={{
  counted: true,
  items: [
    { value: '', label: 'Tất cả' },
    { value: 'd03', label: 'BHYT (D03)', filters: { insuranceType: 'd03' } },
    { value: 'import', label: 'Import', filters: { source: 'import' } },
    { value: 'recent', label: '7 ngày gần đây', filters: { recent: 7 } },
  ],
}}
```

Cột của bảng nhận thêm hai khả năng: `render: (row, stt) => …` có số thứ tự trong cả
tập kết quả (không phải trong trang đang xem), và `renderFooter: (totals) => …` cho
dòng *TỔNG CỘNG* — cần khi ô ghép hai số liệu, vì cách hiện của một dòng dữ liệu không
dùng lại được cho dòng tổng (ô "tổng phí / hình thức nộp" không có hình thức nộp).

## Quy ước khi mở rộng

- **Thêm danh mục mới**: thêm một entry vào `CATALOGS` trong
  [src/features/catalog/CatalogPage.jsx](src/features/catalog/CatalogPage.jsx) và một mục
  vào `navigation.js`. Route sinh tự động từ `CATALOG_TYPES`.
- **Thêm trang danh sách nghiệp vụ**: dùng `<ResourceListPage>` theo bảng trên.
- Nhãn trạng thái dùng chung [src/features/resource/status.jsx](src/features/resource/status.jsx)
  để cùng một trạng thái không hiện hai màu ở hai trang.
- Định dạng số/tiền/ngày luôn qua `src/lib/format.js` để hiển thị nhất quán
  theo locale `vi-VN`.
