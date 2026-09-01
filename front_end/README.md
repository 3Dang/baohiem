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

Các lệnh khác: `npm run build` (đóng gói vào `dist/`), `npm run preview`, `npm run lint`.

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

Giới hạn cần biết: adapter lọc tìm kiếm trong phạm vi trang hiện tại (backend thật
lọc toàn bảng rồi mới phân trang), và dữ liệu sinh lại mỗi lần tải trang nên
thao tác sửa/xoá không được lưu.

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
│  ├─ resource/            # ResourceListPage + useResourceList (dùng chung)
│  ├─ catalog/             # danh mục hành chính & nghiệp vụ
│  ├─ declarations/        # nhập / xuất D03, D05, AR
│  ├─ reports/             # báo cáo theo kỳ
│  └─ …
└─ lib/
   ├─ demo/                # dữ liệu giả cho chế độ demo (xoá được)
   └─ …                    # http, endpoints, format, hooks
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

Mọi trang danh sách gửi `?page=&per_page=&search=` và mong đợi khuôn paginator
của Laravel:

```json
{
  "data": [ /* … */ ],
  "meta": { "current_page": 1, "per_page": 25, "total": 143 }
}
```

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

```
POST /declarations/{d03|d05|ar}/import   multipart, field `file`
     → { total, imported, errors: [{ row, message }] }

GET  /declarations/{d03|d05|ar}/export?from=&to=&format=xlsx|xml
     → tệp nhị phân, tên tệp ở header Content-Disposition
```

### Báo cáo

```
GET /reports/{d03|ar|d05|summary}?from=&to=
    → { data: [...], totals: { count, amount } }
```

### Cài đặt

Backend mô tả cấu hình, frontend render theo mô tả — thêm cấu hình mới không cần
sửa code client:

```
GET /settings → { groups: [{ key, label, fields: [{ key, label, value, type, hint }] }] }
PUT /settings ← { values: { "<fieldKey>": value } }
```

## Quy ước khi mở rộng

- **Thêm danh mục mới**: thêm một entry vào `CATALOGS` trong
  [src/features/catalog/CatalogPage.jsx](src/features/catalog/CatalogPage.jsx) và một mục
  vào `navigation.js`. Route sinh tự động từ `CATALOG_TYPES`.
- **Thêm trang danh sách nghiệp vụ**: dùng `<ResourceListPage>`, chỉ truyền
  `endpoint` và `columns`.
- Định dạng số/tiền/ngày luôn qua `src/lib/format.js` để hiển thị nhất quán
  theo locale `vi-VN`.
