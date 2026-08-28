import Icon from './Icon';
import Button from './Button';
import { formatNumber } from '@/lib/format';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

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
      <div className="flex items-center gap-2">
        <span>
          {formatNumber(from)}–{formatNumber(to)} trong {formatNumber(total)}
        </span>
        <select
          value={perPage}
          onChange={(event) => onPerPageChange(Number(event.target.value))}
          className="rounded-md border-0 py-1 pl-2 pr-7 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-500"
          aria-label="Số dòng mỗi trang"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} / trang
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Trước
        </Button>
        <span className="px-1">
          Trang {formatNumber(page)}/{formatNumber(lastPage)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
          <Icon name="chevronRight" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
