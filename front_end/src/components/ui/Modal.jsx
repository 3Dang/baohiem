import { useEffect } from 'react';
import clsx from 'clsx';
import Icon from './Icon';

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  // Form nhiều cột (phiếu nộp tiền có 12 ô trên một khối) cần rộng hơn hẳn:
  // bó vào 2xl thì mỗi ô còn hơn trăm pixel, số tiền không đọc được
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-6xl',
};

/**
 * Hộp thoại giữa màn hình, dùng cho form thêm/sửa và hỏi xác nhận.
 *
 * `onClose` được gọi khi bấm nền mờ, nút đóng hoặc phím Esc — trang cha tự
 * quyết định có đóng thật hay không (ví dụ đang lưu thì bỏ qua).
 *
 * `descriptionTone: 'danger'` tô đỏ dòng mô tả — dùng cho hộp thoại làm việc
 * khó hoàn tác (nhập biên lai từ cổng BHXH), nơi câu cảnh báo phải đọc được
 * trước khi người dùng kịp bấm nút.
 *
 * `footerAlign: 'start'` đưa hàng nút về bên trái — form thêm/sửa của hệ thống
 * cũ đặt nút chính ngay dưới ô nhập đầu tiên, không phải ở góc phải xa mắt.
 *
 * @param {{ open: boolean, onClose: () => void, title?: string,
 *           description?: React.ReactNode, descriptionTone?: 'muted'|'danger',
 *           footer?: React.ReactNode, footerAlign?: 'start'|'end',
 *           size?: keyof typeof WIDTHS, children?: React.ReactNode }} props
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  descriptionTone = 'muted',
  footer,
  footerAlign = 'end',
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
              {description && (
                <div
                  className={clsx(
                    'mt-0.5 text-xs',
                    descriptionTone === 'danger' ? 'font-medium text-red-600' : 'text-gray-500',
                  )}
                >
                  {description}
                </div>
              )}
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
            <footer
              className={clsx(
                'flex flex-wrap items-center gap-2 border-t border-gray-200 px-4 py-3',
                footerAlign === 'start' ? 'justify-start' : 'justify-end',
              )}
            >
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
