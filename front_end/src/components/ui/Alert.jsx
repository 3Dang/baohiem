import clsx from 'clsx';
import Icon from './Icon';

const TONES = {
  error: { box: 'bg-red-50 text-red-800 ring-red-200', icon: 'warning' },
  success: { box: 'bg-green-50 text-green-800 ring-green-200', icon: 'check' },
  info: { box: 'bg-blue-50 text-blue-800 ring-blue-200', icon: 'inbox' },
};

/**
 * Hộp thông báo trong nội dung trang (không phải toast).
 * Dùng cho lỗi chung của form, cảnh báo nghiệp vụ.
 */
export default function Alert({ tone = 'error', title, children, className }) {
  const { box, icon } = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('flex gap-3 rounded-md p-3 text-sm ring-1', box, className)}
    >
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}
