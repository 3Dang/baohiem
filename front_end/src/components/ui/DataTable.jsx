import clsx from 'clsx';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

/**
 * Bảng dữ liệu chỉ lo phần hiển thị — mọi phân trang / sắp xếp / lọc đều do
 * trang cha quyết định rồi truyền xuống, nhờ vậy dữ liệu luôn lấy từ server.
 *
 * @param {{
 *   columns: Array<{ key: string, header: string, align?: 'left'|'right'|'center',
 *                    width?: string, render?: (row: any) => React.ReactNode }>,
 *   rows: any[],
 *   rowKey?: (row: any) => string | number,
 *   loading?: boolean,
 *   empty?: React.ReactNode,
 * }} props
 */
export default function DataTable({
  columns,
  rows = [],
  rowKey = (row) => row.id,
  loading = false,
  empty,
}) {
  const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
        <Spinner className="h-5 w-5" />
        Đang tải dữ liệu…
      </div>
    );
  }

  if (rows.length === 0) return empty ?? <EmptyState />;

  return (
    // overflow-x-auto giữ bảng nhiều cột dùng được trên màn hình nhỏ
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={clsx(
                  'whitespace-nowrap px-4 py-2.5 font-medium text-gray-600',
                  alignClass[column.align || 'left'],
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    'px-4 py-2.5 text-gray-700',
                    alignClass[column.align || 'left'],
                  )}
                >
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
