/**
 * Tiêu đề trang: tên trang, mô tả ngắn và vùng hành động bên phải.
 * Mọi trang nghiệp vụ đều bắt đầu bằng component này để bố cục nhất quán.
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
