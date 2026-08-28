import clsx from 'clsx';

const TONES = {
  gray: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
};

/** Nhãn nhỏ hiển thị số lượng hoặc trạng thái. */
export default function Badge({ tone = 'gray', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
