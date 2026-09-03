import clsx from 'clsx';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary:
    'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

/**
 * Nút dùng chung. Khi `loading` bật thì tự disable để chặn double-submit.
 *
 * Có `to` thì render thành <Link> nhưng giữ nguyên hình dáng nút: nhiều hành
 * động ở đầu trang thực chất chỉ là điều hướng, không phải gọi API.
 *
 * @param {{ variant?: keyof typeof VARIANTS, size?: keyof typeof SIZES,
 *           loading?: boolean, fullWidth?: boolean, to?: string }} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  to,
  disabled,
  className,
  children,
  ...rest
}) {
  const shared = clsx(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    'disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={shared} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={shared} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
