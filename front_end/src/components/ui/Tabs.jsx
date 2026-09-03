import clsx from 'clsx';
import { formatNumber } from '@/lib/format';

/**
 * Nhóm tab lọc nhanh, đặt giữa tiêu đề trang và bảng dữ liệu.
 *
 * Chỉ là một cách chọn giá trị cho **một** điều kiện lọc (ví dụ trạng thái trả
 * biên: tất cả / chưa trả / đã trả) — trang cha giữ giá trị và ghép vào query,
 * nên tab và thanh bộ lọc luôn cùng nói về một tập dữ liệu.
 *
 * `count` của từng tab là số bản ghi thuộc tập con đó. Con số phải do server
 * đếm (bảng chỉ nắm một trang) nên trang cha nạp riêng rồi truyền vào; thiếu
 * `count` thì tab hiện không kèm số chứ không hiện số 0 gây hiểu sai.
 *
 * @param {{ items: Array<{ value: string, label: string, count?: number }>,
 *           value: string, onChange: (value: string) => void,
 *           className?: string }} props
 */
export default function Tabs({ items = [], value, onChange, className }) {
  if (items.length === 0) return null;

  return (
    <div className={clsx('mb-4 flex justify-center', className)}>
      <div
        role="tablist"
        className="inline-flex flex-wrap items-center justify-center gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-200"
      >
        {items.map((item) => {
          const active = item.value === value;

          return (
            <button
              // Tab "tất cả" mang value rỗng nên phải có khoá dự phòng
              key={item.value || 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {item.label}
              {item.count != null && (
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {formatNumber(item.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
