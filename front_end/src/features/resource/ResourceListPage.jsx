import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ColumnChooser from '@/components/ui/ColumnChooser';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import SearchInput from '@/components/ui/SearchInput';
import SortSelect from '@/components/ui/SortSelect';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/lib/format';
import { useResourceList } from './useResourceList';
import { useResourceMutations } from './useResourceMutations';
import { useResourceFilters } from './useResourceFilters';
import { useRowSelection } from './useRowSelection';
import { useTabCounts } from './useTabCounts';
import { exportParamsOf, tabFiltersOf } from './params';
import ResourceFormModal from './ResourceFormModal';

/** Liên kết "Chỉnh sửa" ở cuối mỗi dòng, kèm nút xoá. */
function RowActions({ row, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline"
        >
          <Icon name="pencil" className="h-3.5 w-3.5" />
          Chỉnh sửa
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
          Xoá
        </button>
      )}
    </div>
  );
}

/**
 * Trang danh sách dùng chung cho mọi danh mục / resource.
 *
 * Thêm một trang mới chỉ cần khai báo endpoint và cột — không lặp lại logic
 * phân trang, tìm kiếm, lọc, chọn dòng, sắp xếp, trạng thái tải.
 *
 * Các phần bật theo nhu cầu:
 * - `formFields` → thêm/sửa/xoá (nút tạo mới, "Chỉnh sửa" mỗi dòng)
 * - `creatable` / `deletable` → tắt riêng nút "Tạo mới" hoặc nút xoá hàng loạt
 *   khi trang chỉ sửa được bản ghi có sẵn (báo cáo: bản ghi mới đến từ trang
 *   nhập hoặc tệp Excel, không tạo tay ở đây)
 * - `filterFields` → thanh bộ lọc kèm chip điều kiện đang áp dụng
 * - `tabs` → dải tab lọc nhanh theo một điều kiện, đặt trên thanh bộ lọc; thêm
 *   `counted: true` để mỗi tab hiện số bản ghi của tập con đó, và `filters` trên
 *   từng tab khi dải tab cắt dữ liệu theo nhiều chiều khác nhau
 * - `bulkActions` → thanh hành động hàng loạt (cột checkbox luôn có sẵn)
 * - `rowActions` → gom hành động của dòng vào menu "Thao tác"
 * - `groupBy` / `footerRow` → bảng chia nhóm và dòng TỔNG CỘNG
 * - `sortOptions` → cặp ô chọn "Sắp xếp theo / Tăng dần" cạnh ô tìm kiếm
 * - `stats` / `panels` → dải ô số liệu và khối gập trước bảng, do trang tự dựng
 *   (chúng cần dữ liệu riêng nên trang cha nạp rồi truyền vào)
 *
 * `actions` và `toolbar` nhận thêm dạng hàm `({ exportParams }) => …`: nút kết
 * xuất cần biết bảng đang lọc theo gì, mà điều kiện đó chỉ có ở bên trong
 * component này. Truyền hàm thì tệp tải về khớp với những gì đang thấy trên
 * màn hình thay vì luôn là cả bảng.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   breadcrumb?: Array<{ label: string, to?: string }>,
 *   endpoint: string,
 *   columns: Array<object>,
 *   filters?: Record<string, any>,
 *   filterFields?: Array<object>,
 *   filterColumns?: 1|2|3|4|5,
 *   deferFilters?: boolean,
 *   tabs?: { name?: string, counted?: boolean,
 *             items: Array<{ value: string, label: string, filters?: object }> },
 *   searchPlaceholder?: string,
 *   toolbar?: React.ReactNode | ((context: { exportParams: object }) => React.ReactNode),
 *   actions?: React.ReactNode | ((context: { exportParams: object }) => React.ReactNode),
 *   stats?: React.ReactNode,
 *   panels?: React.ReactNode,
 *   sortOptions?: Array<{ value: string, label: string }>,
 *   formFields?: Array<object>,
 *   creatable?: boolean,
 *   deletable?: boolean,
 *   createLabel?: string,
 *   recordLabel?: string,
 *   rowLabel?: (row: any) => string,
 *   rowActions?: Array<object>,
 *   bulkActions?: Array<{ key: string, label: string, tone?: string,
 *                         keepSelection?: boolean,
 *                         onRun: (ids: any[]) => Promise<any>|any }>,
 *   perPage?: number,
 *   sortBy?: string,
 *   groupBy?: object,
 *   footerRow?: (totals: any) => { label: React.ReactNode, row: object },
 *   emptyTitle?: string,
 *   emptyDescription?: string,
 *   selectable?: boolean,
 * }} props
 */
export default function ResourceListPage({
  title,
  description,
  breadcrumb,
  endpoint,
  columns,
  filters,
  filterFields,
  filterColumns,
  deferFilters = false,
  tabs,
  searchPlaceholder,
  toolbar,
  actions,
  stats,
  panels,
  sortOptions,
  formFields,
  creatable = true,
  deletable = true,
  createLabel,
  recordLabel = 'bản ghi',
  rowLabel = (row) => row.name ?? row.code ?? `#${row.id}`,
  rowActions,
  bulkActions,
  perPage,
  sortBy,
  groupBy,
  footerRow,
  emptyTitle = 'Không có dữ liệu nào',
  emptyDescription,
  selectable: selectableProp,
}) {
  const toast = useToast();
  const filterState = useResourceFilters(filterFields ?? [], { defer: deferFilters });
  // Tab là một điều kiện lọc nữa, chỉ khác cách trình bày
  const [tabValue, setTabValue] = useState(tabs?.items?.[0]?.value ?? '');
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const list = useResourceList(endpoint, {
    filters: {
      ...filters,
      ...filterState.params,
      ...tabFiltersOf(tabs, tabValue),
    },
    perPage,
    sortBy,
  });

  const tabItems = useTabCounts(endpoint, { tabs, params: list.params });

  /*
   * Điều kiện để kết xuất: bộ lọc và thứ tự sắp xếp đang áp dụng, bỏ phân trang.
   * Trang cha khai `actions`/`toolbar` dạng hàm sẽ nhận cái này và gắn vào nút
   * xuất, nhờ vậy tệp tải về đúng bằng những gì bảng đang hiện.
   */
  const slotContext = { exportParams: exportParamsOf(list.params) };
  const renderSlot = (slot) => (typeof slot === 'function' ? slot(slotContext) : slot);

  const { create, update, remove, removeMany } = useResourceMutations(endpoint);
  const selection = useRowSelection(endpoint, { params: list.params });

  // `editing`: null = đang thêm mới, object = đang sửa, undefined = form đóng
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [runningBulk, setRunningBulk] = useState(null);

  const editable = Boolean(formFields?.length);
  // Trang chỉ sửa bản ghi có sẵn thì tắt nút tạo mới và nút xoá hàng loạt: hồ sơ
  // báo cáo sinh ra từ trang nhập hoặc tệp Excel, không tạo/xoá tay ở đây
  const canCreate = editable && creatable;
  const canDelete = editable && deletable;
  // Chọn dòng có mặt ở mọi trang danh sách: dù không sửa được thì vẫn cần chọn
  // để xuất, xác nhận, gửi lại… Trang chỉ đọc thuần muốn tắt thì đặt `selectable`.
  const selectable = selectableProp ?? true;
  const activeMutation = editing ? update : create;
  const newButtonLabel = createLabel ?? `Tạo mới ${recordLabel}`;
  const isFiltered = filterState.isDirty || Boolean(list.search);

  /** Mở/đóng form; reset mutation để lỗi của lần trước không hiện lại. */
  const openForm = (record) => {
    create.reset();
    update.reset();
    setEditing(record);
  };

  /** Thêm cột hành động ở cuối khi trang cho phép sửa/xoá hoặc có menu thao tác. */
  const actionColumn = () => {
    if (rowActions?.length) {
      return {
        key: '__actions',
        header: '',
        align: 'right',
        width: '8rem',
        render: (row) => (
          <RowActionsMenu
            row={row}
            actions={rowActions.map((action) =>
              // Hai hành động dựng sẵn để trang không phải tự nối vào form/xoá
              action.key === 'edit'
                ? { ...action, onRun: openForm }
                : action.key === 'delete'
                  ? { ...action, onRun: setDeleting }
                  : action,
            )}
          />
        ),
      };
    }

    return {
      key: '__actions',
      header: '',
      align: 'right',
      width: '11rem',
      render: (row) => (
        <RowActions row={row} onEdit={openForm} onDelete={canDelete ? setDeleting : undefined} />
      ),
    };
  };

  const allColumns = editable || rowActions?.length ? [...columns, actionColumn()] : columns;
  const tableColumns = allColumns.filter((column) => !hiddenColumns.includes(column.key));

  const submitForm = (values) => {
    const mutation = editing ? update : create;
    const payload = editing ? { id: editing.id, values } : values;

    mutation.mutate(payload, { onSuccess: () => setEditing(undefined) });
  };

  const confirmDelete = () => {
    remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  /** Xoá các dòng đã chọn, rồi bỏ chọn vì chúng không còn tồn tại. */
  const confirmBulkDelete = () => {
    removeMany.mutate(selection.selectedIds, {
      onSuccess: () => {
        setBulkDeleting(false);
        selection.clear();
      },
    });
  };

  /**
   * Chạy một hành động hàng loạt.
   *
   * Xong thì bỏ chọn và tải lại: hành động vừa đổi dữ liệu nên các dòng đang
   * chọn có thể đã khác. Trừ hành động khai `keepSelection` (kết xuất) — nó chỉ
   * đọc, giữ lựa chọn để người dùng xuất tiếp mẫu khác trên cùng tập dòng.
   *
   * Lỗi phải báo bằng toast: hành động hàng loạt chạy ngầm, im lặng thì người
   * dùng tưởng đã xong và không biết tập dòng của mình chưa được xử lý.
   */
  const runBulk = async (action) => {
    setRunningBulk(action.key);
    try {
      await action.onRun(selection.selectedIds);
      if (action.keepSelection) return;

      selection.clear();
      list.refetch();
    } catch (error) {
      toast.error(`Không thực hiện được "${action.label}": ${error.message}`);
    } finally {
      setRunningBulk(null);
    }
  };

  /**
   * Chọn toàn bộ kết quả khớp bộ lọc. Báo lỗi bằng toast chứ không để im lặng:
   * người dùng vừa bấm "chọn tất cả" mà số dòng không đổi thì rất khó hiểu.
   */
  const selectAllMatching = async () => {
    try {
      await selection.selectAllMatching();
    } catch (error) {
      toast.error(`Không lấy được danh sách đầy đủ: ${error.message}`);
    }
  };

  const createButton = (
    <Button onClick={() => openForm(null)}>
      <Icon name="plus" className="h-4 w-4" />
      {newButtonLabel}
    </Button>
  );

  return (
    <>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}

      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {renderSlot(actions)}
            {canCreate && createButton}
          </>
        }
      />

      {tabs && <Tabs items={tabItems} value={tabValue} onChange={setTabValue} />}

      {stats}

      {panels && <div className="mb-4 space-y-3">{panels}</div>}

      {list.error && (
        <Alert className="mb-4" title="Không tải được dữ liệu">
          {list.error.message}
        </Alert>
      )}

      <Card bodyClassName="p-0">
        {filterFields?.length > 0 && (
          <FilterBar
            fields={filterFields}
            values={filterState.values}
            onChange={filterState.setValue}
            chips={filterState.chips}
            onClearChip={filterState.clearNames}
            onReset={filterState.reset}
            onApply={deferFilters ? filterState.apply : undefined}
            columns={filterColumns}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {renderSlot(toolbar)}
            <Button variant="secondary" size="sm" onClick={list.refetch}>
              <Icon name="refresh" className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {sortOptions?.length > 0 && (
              <SortSelect options={sortOptions} sort={list.sort} onChange={list.setSort} />
            )}
            <SearchInput
              value={list.search}
              onChange={list.setSearch}
              placeholder={searchPlaceholder}
            />
            {filterState.chips.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1 text-gray-400">
                <Icon name="filter" className="h-4 w-4" />
                <Badge tone="brand">{filterState.chips.length}</Badge>
              </span>
            )}
            <ColumnChooser
              columns={allColumns}
              hidden={hiddenColumns}
              onToggle={(key) =>
                setHiddenColumns((prev) =>
                  prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
                )
              }
            />
          </div>
        </div>

        {/* Thanh hành động hàng loạt chỉ xuất hiện khi đã chọn dòng */}
        {selectable && selection.count > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-brand-50 px-4 py-2">
            <span className="text-xs font-medium text-brand-900">
              Đã chọn {formatNumber(selection.count)} dòng
            </span>

            {/*
              Checkbox đầu bảng chỉ chọn được trang đang xem. Khi kết quả trải
              nhiều trang, đây là cách chọn cả tập — id các trang khác do server
              trả về, không đoán từ dữ liệu đang có.
            */}
            {selection.count < list.total && (
              <button
                type="button"
                onClick={selectAllMatching}
                disabled={selection.loadingAll}
                className="text-xs font-medium text-brand-700 underline hover:text-brand-900 disabled:no-underline disabled:opacity-60"
              >
                {selection.loadingAll
                  ? 'Đang chọn…'
                  : `Chọn tất cả ${formatNumber(list.total)} kết quả`}
              </button>
            )}

            {selection.count === list.total && list.total > list.rows.length && (
              <span className="text-xs text-brand-700">Đã chọn toàn bộ kết quả</span>
            )}

            {(bulkActions ?? []).map((action) => (
              <Button
                key={action.key}
                variant={action.tone === 'danger' ? 'danger' : 'secondary'}
                size="sm"
                loading={runningBulk === action.key}
                disabled={Boolean(runningBulk)}
                onClick={() => runBulk(action)}
              >
                {action.label}
              </Button>
            ))}
            {canDelete && (
              <Button variant="danger" size="sm" onClick={() => setBulkDeleting(true)}>
                <Icon name="trash" className="h-4 w-4" />
                Xoá {formatNumber(selection.count)} dòng
              </Button>
            )}

            <button
              type="button"
              onClick={selection.clear}
              className="ml-auto text-xs text-gray-500 hover:text-gray-800 hover:underline"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <DataTable
          columns={tableColumns}
          rows={list.rows}
          // Để cột STT đánh số tiếp tục sang trang sau, không quay lại 1
          rowOffset={(list.page - 1) * list.perPage}
          loading={list.isLoading}
          selectable={selectable}
          selectedIds={selection.selectedIds}
          onToggleRow={selection.toggleRow}
          onToggleAll={selection.toggleAll}
          sort={list.sort}
          onSortChange={list.toggleSort}
          groupBy={groupBy}
          footer={footerRow && list.totals ? footerRow(list.totals) : undefined}
          empty={
            <EmptyState
              title={emptyTitle}
              description={
                isFiltered
                  ? 'Không có bản ghi nào khớp điều kiện đang lọc. Thử nới rộng bộ lọc.'
                  : emptyDescription
              }
              action={canCreate && !isFiltered ? createButton : undefined}
            />
          }
        />

        {list.total > 0 && (
          <Pagination
            page={list.page}
            perPage={list.perPage}
            total={list.total}
            onPageChange={list.setPage}
            onPerPageChange={list.setPerPage}
          />
        )}
      </Card>

      {editable && (
        <ResourceFormModal
          open={editing !== undefined}
          title={editing ? `Sửa ${recordLabel}` : `Thêm ${recordLabel}`}
          fields={formFields}
          record={editing}
          submitting={activeMutation.isPending}
          error={activeMutation.error}
          onSubmit={submitForm}
          onClose={() => setEditing(undefined)}
        />
      )}

      <ConfirmDialog
        open={bulkDeleting}
        title={`Xoá ${formatNumber(selection.count)} ${recordLabel}`}
        message={`Xoá ${formatNumber(selection.count)} ${recordLabel} đã chọn? Hành động này không hoàn tác được.`}
        confirmLabel="Xoá tất cả"
        loading={removeMany.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Xoá ${recordLabel}`}
        message={
          deleting &&
          `Xoá ${recordLabel} “${rowLabel(deleting)}”? Hành động này không hoàn tác được.`
        }
        confirmLabel="Xoá"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
