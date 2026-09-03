import { useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon';

/**
 * Khối nội dung gập lại được, mặc định đóng.
 *
 * Dùng cho những thông tin phụ nhưng hay phải tra (danh sách hồ sơ lệch ngày
 * khi nhập từ cổng BHXH): để mở sẵn thì đẩy bảng dữ liệu chính xuống dưới màn
 * hình, mà bỏ đi thì không còn chỗ nào xem.
 *
 * @param {{ title: string, icon?: string, badge?: React.ReactNode,
 *           defaultOpen?: boolean, className?: string,
 *           children: React.ReactNode }} props
 */
export default function Collapsible({
  title,
  icon,
  badge,
  defaultOpen = false,
  className,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={clsx('rounded-lg bg-white shadow-sm ring-1 ring-gray-200', className)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {icon && <Icon name={icon} className="h-4 w-4 text-brand-600" />}
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {badge}
        <Icon
          name={open ? 'chevronUp' : 'chevronDown'}
          className="ml-auto h-4 w-4 text-gray-400"
        />
      </button>

      {open && <div className="border-t border-gray-200 p-4">{children}</div>}
    </section>
  );
}
