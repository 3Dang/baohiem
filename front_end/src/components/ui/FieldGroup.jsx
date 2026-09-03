import { useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon';

const GRID = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Khối các field cùng một chủ đề: nền xanh nhạt, tiêu đề kèm icon.
 *
 * Dùng chung cho thanh bộ lọc và form thêm/sửa để một "khối" ở hai nơi trông
 * giống nhau — trước đây mỗi nơi tự dựng nền và tiêu đề riêng nên chỉnh một bên
 * là lệch bên kia.
 *
 * `collapsible` thêm mũi mở/gập: form tạo mới có thể dài tới bốn khối, gập lại
 * thì thấy được nút Tạo mà không phải cuộn. Bộ lọc không cần vì luôn ngắn.
 *
 * @param {{ title: string, icon?: string, hint?: string, columns?: 1|2|3|4,
 *           collapsible?: boolean, defaultOpen?: boolean,
 *           children: React.ReactNode }} props
 */
export default function FieldGroup({
  title,
  icon,
  hint,
  columns = 2,
  collapsible = false,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shown = collapsible ? open : true;

  return (
    <fieldset className="rounded-lg bg-brand-100/60 p-3">
      <legend className="w-full px-1">
        <span className="flex items-center gap-1.5">
          {icon && <Icon name={icon} className="h-4 w-4 text-brand-700" />}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              title={open ? `Gập ${title}` : `Mở ${title}`}
              className="ml-auto rounded p-0.5 text-gray-500 hover:bg-brand-200/60 hover:text-gray-800"
            >
              <Icon name={open ? 'chevronUp' : 'chevronDown'} className="h-4 w-4" />
              <span className="sr-only">{open ? 'Gập' : 'Mở'} {title}</span>
            </button>
          )}
        </span>
      </legend>

      {hint && shown && <p className="mb-2 px-1 text-xs text-gray-600">{hint}</p>}

      {shown && <div className={clsx('grid gap-3', GRID[columns])}>{children}</div>}
    </fieldset>
  );
}
