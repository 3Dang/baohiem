import { useState } from 'react';
import Icon from './Icon';
import { useClickOutside } from '@/lib/hooks';

/**
 * Chọn cột hiển thị của bảng (biểu tượng cột ở góc phải thanh công cụ).
 *
 * Bảng nghiệp vụ có nhiều cột hơn màn hình, nên người dùng cần tự ẩn những cột
 * không dùng tới. Chỉ ẩn ở phía hiển thị — dữ liệu vẫn tải đủ, nên bật lại là
 * thấy ngay, không phải gọi lại API.
 *
 * @param {{ columns: Array<{ key: string, header: string }>,
 *           hidden: string[], onToggle: (key: string) => void }} props
 */
export default function ColumnChooser({ columns, hidden, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        title="Chọn cột hiển thị"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <Icon name="columns" className="h-4 w-4" />
        <span className="sr-only">Chọn cột hiển thị</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={!hidden.includes(column.key)}
                onChange={() => onToggle(column.key)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {/* Cột không có tiêu đề (cột hành động) vẫn cần một nhãn để chọn */}
              {column.header || 'Hành động'}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
