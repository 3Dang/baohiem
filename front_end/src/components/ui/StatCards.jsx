import clsx from 'clsx';
import Icon from './Icon';
import Spinner from './Spinner';

/** Màu theo ý nghĩa của con số: chờ xử lý (hổ phách), đã xong (xanh), tổng (xanh thương hiệu). */
const TONES = {
  brand: { value: 'text-brand-700', ring: 'ring-brand-200', icon: 'text-brand-400' },
  amber: { value: 'text-amber-700', ring: 'ring-amber-200', icon: 'text-amber-400' },
  green: { value: 'text-green-700', ring: 'ring-green-200', icon: 'text-green-400' },
  red: { value: 'text-red-700', ring: 'ring-red-200', icon: 'text-red-400' },
  gray: { value: 'text-gray-900', ring: 'ring-gray-200', icon: 'text-gray-300' },
};

/**
 * Dải ô số liệu đặt trên bảng dữ liệu của trang báo cáo.
 *
 * Trả lời ngay câu hỏi mở trang là để xem: hôm nay còn bao nhiêu hồ sơ chưa
 * duyệt. `hint` là dòng phụ dưới con số (ví dụ "Hôm qua", "Toàn bộ kỳ") nên
 * nhãn chính giữ ngắn, không phải nhồi cả bối cảnh vào một dòng.
 *
 * @param {{ items: Array<{ key: string, label: string, value: React.ReactNode,
 *           hint?: string, tone?: keyof typeof TONES, icon?: string }>,
 *           loading?: boolean, className?: string }} props
 */
export default function StatCards({ items = [], loading = false, className }) {
  if (items.length === 0) return null;

  return (
    <div
      className={clsx(
        'mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className,
      )}
    >
      {items.map((item) => {
        const tone = TONES[item.tone ?? 'gray'];

        return (
          <div
            key={item.key}
            className={clsx('rounded-lg bg-white p-4 shadow-sm ring-1', tone.ring)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {item.label}
              </p>
              {item.icon && <Icon name={item.icon} className={clsx('h-4 w-4', tone.icon)} />}
            </div>

            {/* Đang tải thì thay số bằng spinner, không hiện 0 vì 0 là một kết quả thật */}
            <p className={clsx('mt-2 text-2xl font-semibold', tone.value)}>
              {loading ? <Spinner className="h-6 w-6 text-gray-300" /> : item.value}
            </p>

            {item.hint && <p className="mt-1 text-xs text-gray-500">{item.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
