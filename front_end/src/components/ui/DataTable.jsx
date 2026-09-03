import { Fragment, useEffect, useRef } from 'react';
import clsx from 'clsx';
import Icon from './Icon';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Bảng dữ liệu chỉ lo phần hiển thị — mọi phân trang / sắp xếp / lọc đều do
 * trang cha quyết định rồi truyền xuống, nhờ vậy dữ liệu luôn lấy từ server.
 *
 * Bật `selectable` thì có thêm cột checkbox ở đầu để chọn nhiều dòng (phục vụ
 * hành động hàng loạt). Trang cha giữ danh sách id đã chọn, bảng chỉ phát
 * sự kiện — như vậy lựa chọn không bị mất khi bảng tải lại.
 *
 * `groupBy` gom các dòng liền nhau thành nhóm (hồ sơ D03 gom theo mã hộ), kèm
 * một dòng tóm tắt cuối nhóm. `footer` là dòng tổng cộng của cả bảng.
 *
 * `render` nhận thêm số thứ tự của dòng trong cả tập kết quả (đã tính `rowOffset`
 * của trang đang xem), để cột STT đánh số tiếp tục qua các trang.
 *
 * @param {{
 *   columns: Array<{ key: string, header: string, align?: 'left'|'right'|'center',
 *                    width?: string, sortable?: boolean,
 *                    render?: (row: any, stt: number) => React.ReactNode,
 *                    renderFooter?: (totals: any) => React.ReactNode }>,
 *   rows: any[],
 *   rowKey?: (row: any) => string | number,
 *   rowOffset?: number,
 *   loading?: boolean,
 *   empty?: React.ReactNode,
 *   selectable?: boolean,
 *   selectedIds?: Array<string|number>,
 *   onToggleRow?: (id: string|number) => void,
 *   onToggleAll?: (ids: Array<string|number>, checked: boolean) => void,
 *   sort?: { by?: string, dir?: 'asc'|'desc' },
 *   onSortChange?: (key: string) => void,
 *   groupBy?: { key: (row: any) => string|number,
 *               label: (row: any, rows: any[]) => React.ReactNode,
 *               summary?: (rows: any[]) => React.ReactNode },
 *   footer?: { label: React.ReactNode, row: object },
 * }} props
 */
export default function DataTable({
  columns,
  rows = [],
  rowKey = (row) => row.id,
  rowOffset = 0,
  loading = false,
  empty,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  sort,
  onSortChange,
  groupBy,
  footer,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
        <Spinner className="h-5 w-5" />
        Đang tải dữ liệu…
      </div>
    );
  }

  if (rows.length === 0) return empty ?? <EmptyState />;

  const pageIds = rows.map(rowKey);
  const selected = new Set(selectedIds);
  // "Chọn tất cả" chỉ nói về trang đang hiện, vì bảng không biết các trang khác
  const allChecked = pageIds.every((id) => selected.has(id));
  const someChecked = !allChecked && pageIds.some((id) => selected.has(id));
  const spanAll = columns.length + (selectable ? 1 : 0);

  return (
    // overflow-x-auto giữ bảng nhiều cột dùng được trên màn hình nhỏ
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-brand-100/70">
          <tr>
            {selectable && (
              <th scope="col" className="w-10 px-4 py-2.5">
                <HeaderCheckbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={() => onToggleAll?.(pageIds, !allChecked)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={clsx(
                  'whitespace-nowrap px-4 py-2.5 font-semibold text-gray-800',
                  alignClass[column.align || 'left'],
                )}
              >
                {column.sortable && onSortChange ? (
                  <SortButton column={column} sort={sort} onSortChange={onSortChange} />
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        {groupBy ? (
          <GroupedBody
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            selectable={selectable}
            selected={selected}
            onToggleRow={onToggleRow}
            onToggleAll={onToggleAll}
            groupBy={groupBy}
            spanAll={spanAll}
            rowOffset={rowOffset}
          />
        ) : (
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <BodyRow
                key={rowKey(row)}
                row={row}
                id={rowKey(row)}
                stt={rowOffset + index + 1}
                columns={columns}
                selectable={selectable}
                selected={selected}
                onToggleRow={onToggleRow}
              />
            ))}
          </tbody>
        )}

        {footer && (
          <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-gray-900">
            <FooterRow columns={columns} footer={footer} selectable={selectable} />
          </tfoot>
        )}
      </table>
    </div>
  );
}

/**
 * Dòng TỔNG CỘNG.
 *
 * Nhãn chiếm hết các cột mô tả ở đầu bảng cho tới cột có số liệu đầu tiên: để
 * riêng trong cột đầu (thường là STT, rộng 4,5rem) thì chữ bị bó lại thành mấy
 * dòng, còn các cột mô tả ở giữa thì vốn không có gì để hiện.
 */
function FooterRow({ columns, footer, selectable }) {
  /*
   * Giá trị của một cột trên dòng tổng. Cột nào trình bày ghép nhiều số trong
   * một ô thì khai `renderFooter` riêng, vì cách hiện của một dòng dữ liệu không
   * dùng lại được cho dòng tổng (ô "tổng phí / hình thức nộp" không có hình thức
   * nộp). Không khai `renderFooter` thì cột chỉ hiện khi `footer.row` có khoá
   * tương ứng — gọi `render` với dòng thiếu dữ liệu sẽ in ra những giá trị vô
   * nghĩa (nhãn trạng thái, dấu gạch ngang…).
   */
  const values = columns.map((column) =>
    column.renderFooter
      ? column.renderFooter(footer.row)
      : column.key in footer.row
        ? (column.render ? column.render(footer.row) : footer.row[column.key])
        : null,
  );

  /*
   * Nhãn chiếm mọi cột trước cột có số liệu đầu tiên. Ít nhất một cột: nếu chính
   * cột đầu đã có số liệu thì nhãn vẫn phải có chỗ đứng, và cột đó nhường lại.
   */
  const firstValue = values.findIndex((value) => value != null);
  const labelSpan = firstValue === -1 ? columns.length : Math.max(firstValue, 1);

  return (
    <tr>
      {selectable && <td className="px-4 py-2.5" />}
      <td colSpan={labelSpan} className="whitespace-nowrap px-4 py-2.5">
        {footer.label}
      </td>
      {columns.slice(labelSpan).map((column, index) => (
        <td
          key={column.key}
          className={clsx('px-4 py-2.5', alignClass[column.align || 'left'])}
        >
          {values[labelSpan + index]}
        </td>
      ))}
    </tr>
  );
}

/** Một dòng dữ liệu, dùng lại cho cả bảng phẳng và bảng có nhóm. */
function BodyRow({ row, id, stt, columns, selectable, selected, onToggleRow }) {
  return (
    <tr className={clsx('hover:bg-gray-50', selected.has(id) && 'bg-brand-50/60')}>
      {selectable && (
        <td className="px-4 py-2.5">
          <input
            type="checkbox"
            checked={selected.has(id)}
            onChange={() => onToggleRow?.(id)}
            aria-label="Chọn dòng"
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
        </td>
      )}
      {columns.map((column) => (
        <td
          key={column.key}
          className={clsx('px-4 py-2.5 text-gray-700', alignClass[column.align || 'left'])}
        >
          {column.render ? column.render(row, stt) : (row[column.key] ?? '—')}
        </td>
      ))}
    </tr>
  );
}

/**
 * Thân bảng chia nhóm: mỗi nhóm có một dòng tiêu đề (kèm checkbox chọn cả
 * nhóm) và một dòng tóm tắt. Dùng cho hồ sơ D03 — người dùng đọc theo hộ gia
 * đình chứ không theo từng người.
 */
function GroupedBody({
  columns,
  rows,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  onToggleAll,
  groupBy,
  spanAll,
  rowOffset,
}) {
  // Giữ nguyên thứ tự server trả về; chỉ gom các dòng cùng khoá lại với nhau.
  // `stt` gắn vào từng dòng ở đây để cột STT vẫn đánh số liên tục qua các nhóm.
  const groups = [];
  rows.forEach((row, index) => {
    const key = groupBy.key(row);
    const entry = { row, stt: rowOffset + index + 1 };
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, entries: [entry] });
  });

  return (
    <tbody className="divide-y divide-gray-100">
      {groups.map((group) => {
        const groupRows = group.entries.map((entry) => entry.row);
        const groupIds = groupRows.map(rowKey);
        const groupChecked = groupIds.every((id) => selected.has(id));

        return (
          <Fragment key={group.key}>
            <tr className="bg-brand-100/50">
              {selectable && (
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={groupChecked}
                    onChange={() => onToggleAll?.(groupIds, !groupChecked)}
                    aria-label="Chọn cả nhóm"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </td>
              )}
              <td colSpan={columns.length} className="px-4 py-2 font-medium text-gray-900">
                {groupBy.label(groupRows[0], groupRows)}
              </td>
            </tr>

            {group.entries.map((entry) => (
              <BodyRow
                key={rowKey(entry.row)}
                row={entry.row}
                id={rowKey(entry.row)}
                stt={entry.stt}
                columns={columns}
                selectable={selectable}
                selected={selected}
                onToggleRow={onToggleRow}
              />
            ))}

            {groupBy.summary && (
              <tr className="bg-gray-50 text-xs text-gray-600">
                <td colSpan={spanAll} className="px-4 py-2">
                  {groupBy.summary(groupRows)}
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </tbody>
  );
}

/** Tiêu đề cột bấm được để đổi chiều sắp xếp; sắp xếp thật do server làm. */
function SortButton({ column, sort, onSortChange }) {
  const active = sort?.by === column.key;

  return (
    <button
      type="button"
      onClick={() => onSortChange(column.key)}
      title={`Sắp xếp theo ${column.header}`}
      className="inline-flex items-center gap-1 font-semibold text-gray-800 hover:text-brand-700"
    >
      {column.header}
      <Icon
        name={active && sort.dir === 'desc' ? 'chevronUp' : 'chevronDown'}
        className={clsx('h-3 w-3', active ? 'text-brand-700' : 'text-gray-400')}
      />
    </button>
  );
}

/**
 * Checkbox ở đầu bảng. Khi chỉ một số dòng được chọn thì hiện dạng "lơ lửng"
 * (indeterminate) — trạng thái này chỉ đặt được qua DOM, không có attribute HTML.
 */
function HeaderCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Chọn tất cả dòng trong trang"
      title="Chọn tất cả dòng trong trang"
      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
    />
  );
}
