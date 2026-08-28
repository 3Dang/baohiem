# Baohiem

Hệ thống quản trị bảo hiểm (BHXH/BHYT tự nguyện). Repo chứa cả hai phần:

| Thư mục | Nội dung | Trạng thái |
| --- | --- | --- |
| [front_end/](front_end/) | Giao diện quản trị — React 18 + Vite + Tailwind | Đã có |
| [back_end/](back_end/) | REST API phục vụ frontend | Chưa triển khai |

## Bắt đầu

```bash
cd front_end
npm install
cp .env.example .env      # trỏ VITE_PROXY_TARGET về backend
npm run dev               # http://localhost:5173
```

Hợp đồng API giữa hai phần (đường dẫn, khuôn dữ liệu phân trang, quy ước lỗi 422)
được mô tả đầy đủ trong [front_end/README.md](front_end/README.md) — backend
triển khai theo tài liệu đó.
