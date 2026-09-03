import clsx from 'clsx';
import Spinner from './Spinner';

/**
 * Công tắc bật/tắt trong bảng dữ liệu (cột Status của hệ thống cũ).
 *
 * Đổi trạng thái là ghi ngay lên server, nên khi đang gửi thì khoá công tắc
 * lại để không tạo hai request trái ngược nhau.
 *
 * @param {{ checked: boolean, onChange: (next: boolean) => void,
 *           loading?: boolean, disabled?: boolean, label?: string,
 *           id?: string }} props
 */
export default function Toggle({
  checked,
  onChange,
  loading = false,
  disabled = false,
  label,
  id,
}) {
  const locked = disabled || loading;

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={locked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        checked ? 'bg-brand-900' : 'bg-gray-200',
        locked && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={clsx(
          'flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      >
        {loading && <Spinner className="h-3 w-3 text-gray-400" />}
      </span>
    </button>
  );
}
