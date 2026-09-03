import { useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon';
import { useClickOutside } from '@/lib/hooks';

/**
 * Nút "Thao tác" gom các hành động của một dòng vào menu thả xuống.
 *
 * Dùng cho bảng nhiều cột (quận/huyện, phường/xã…): để các liên kết hành động
 * nằm ngang sẽ đẩy bảng rộng thêm, trong khi hành động thì ít khi dùng tới.
 *
 * @param {{ row: any, actions: Array<{ key: string, label: string, icon?: string,
 *           tone?: 'danger', onRun: (row: any) => void }> }} props
 */
export default function RowActionsMenu({ row, actions = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
      >
        <Icon name="ellipsis" className="h-3.5 w-3.5" />
        Thao tác
      </button>

      {open && (
        // right-0 để menu không tràn ra ngoài khi cột nằm sát mép phải bảng
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                action.onRun(row);
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-gray-50',
                action.tone === 'danger' ? 'text-red-600' : 'text-gray-700',
              )}
            >
              {action.icon && <Icon name={action.icon} className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
