import Icon from './Icon';

/**
 * Cặp ô chọn "sắp xếp theo cột" + "chiều sắp xếp".
 *
 * Bảng đã bấm được vào tiêu đề cột để sắp xếp, nhưng bảng nhiều cột phải cuộn
 * ngang mới thấy cột cần bấm — hai ô chọn này để chọn thẳng, đúng như hệ thống
 * cũ đặt trên các trang xuất hồ sơ.
 *
 * Sắp xếp thật vẫn do server làm; đây chỉ là một cách khác để đặt `sort_by`.
 *
 * @param {{ options: Array<{ value: string, label: string }>,
 *           sort: { by?: string, dir?: 'asc'|'desc' },
 *           onChange: (next: { by: string, dir: 'asc'|'desc' }) => void }} props
 */
export default function SortSelect({ options = [], sort = {}, onChange }) {
  if (options.length === 0) return null;

  const selectClass =
    'h-8 rounded-md border-0 bg-white py-0 pl-2 pr-7 text-xs text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-500';

  return (
    <div className="flex items-center gap-1">
      <Icon name="sort" className="h-4 w-4 text-gray-400" />

      <select
        aria-label="Sắp xếp theo"
        value={sort.by ?? ''}
        onChange={(event) => onChange({ by: event.target.value, dir: sort.dir ?? 'asc' })}
        className={selectClass}
      >
        <option value="">Không sắp xếp</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Chiều sắp xếp"
        value={sort.dir ?? 'asc'}
        // Không có cột thì chiều sắp xếp vô nghĩa
        disabled={!sort.by}
        onChange={(event) => onChange({ by: sort.by, dir: event.target.value })}
        className={selectClass}
      >
        <option value="asc">Tăng dần</option>
        <option value="desc">Giảm dần</option>
      </select>
    </div>
  );
}
