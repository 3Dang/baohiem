import { useEffect } from 'react';
import clsx from 'clsx';
import Icon from './Icon';

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Hộp thoại giữa màn hình, dùng cho form thêm/sửa và hỏi xác nhận.
 *
 * `onClose` được gọi khi bấm nền mờ, nút đóng hoặc phím Esc — trang cha tự
 * quyết định có đóng thật hay không (ví dụ đang lưu thì bỏ qua).
 *
 * @param {{ open: boolean, onClose: () => void, title?: string,
 *           description?: string, footer?: React.ReactNode,
 *           size?: keyof typeof WIDTHS, children?: React.ReactNode }} props
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'lg',
  children,
}) {
  // Esc để đóng: chỉ gắn listener khi hộp thoại đang mở
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Chặn cuộn trang phía sau khi hộp thoại mở
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gray-900/50"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'relative w-full rounded-lg bg-white shadow-xl ring-1 ring-gray-200',
            WIDTHS[size],
          )}
        >
          <header className="flex items-start gap-3 border-b border-gray-200 px-4 py-3">
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
              {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Icon name="close" className="h-5 w-5" />
              <span className="sr-only">Đóng</span>
            </button>
          </header>

          <div className="p-4">{children}</div>

          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
