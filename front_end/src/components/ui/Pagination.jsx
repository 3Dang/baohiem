import clsx from 'clsx';
import Icon from './Icon';
import { formatNumber } from '@/lib/format';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Dãy số trang hiển thị: luôn có trang đầu, trang cuối và các trang quanh trang
 * hiện tại; phần bị lược bỏ trả về `'…'`. Nhờ vậy bảng 189 trang vẫn nhảy được
 * tới trang cuối bằng một cú bấm.
 *
 * @param {number} page trang đang xem
 * @param {number} lastPage tổng số trang
 * @returns {Array<number|'…'>}
 */
export function pageItems(page, lastPage) {
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);

  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < lastPage);
  const items = [1, ...around, lastPage];

  return items.flatMap((value, index) => {
    const previous = items[index - 1];
    // Có khoảng trống giữa hai số liền kề thì chèn dấu lược
    return previous && value - previous > 1 ? ['…', value] : [value];
  });
}

/**
 * Phân trang phía server. Trang cha nắm `page`/`perPage` và gọi lại API,
 * component này chỉ phát sự kiện thay đổi.
 */
export default function Pagination({ page, perPage, total, onPageChange, onPerPageChange }) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
      <span className="text-brand-800">
        Đang hiện từ {formatNumber(from)} đến {formatNumber(to)} của {formatNumber(total)} kết quả
      </span>

      <div className="flex items-center gap-2">
        <span className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
          Mỗi trang
        </span>
        <select
          value={perPage}
          onChange={(event) => onPerPageChange(Number(event.target.value))}
          className="rounded-md border-0 py-1 pl-2 pr-7 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-500"
          aria-label="Số dòng mỗi trang"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Một trang duy nhất thì không cần điều hướng */}
      {lastPage > 1 && (
        <nav className="flex items-center gap-1" aria-label="Phân trang">
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            label="Trang trước"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </PageButton>

          {pageItems(page, lastPage).map((item, index) =>
            item === '…' ? (
              // Dấu lược không bấm được nên khoá theo vị trí, không theo giá trị
              <span key={`gap-${index}`} className="px-1 text-gray-400">
                …
              </span>
            ) : (
              <PageButton
                key={item}
                active={item === page}
                onClick={() => onPageChange(item)}
                label={`Trang ${item}`}
              >
                {item}
              </PageButton>
            ),
          )}

          <PageButton
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            label="Trang sau"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </PageButton>
        </nav>
      )}
    </div>
  );
}

/** Một ô số trang; trang đang xem được tô nền để thấy ngay vị trí. */
function PageButton({ active = false, disabled = false, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium',
        active
          ? 'bg-brand-600 text-white'
          : 'text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white',
      )}
    >
      {children}
    </button>
  );
}
