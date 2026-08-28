import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import Icon from '@/components/ui/Icon';
import { useResourceList } from './useResourceList';

/**
 * Trang danh sách dùng chung cho mọi danh mục / resource.
 *
 * Nhờ component này, thêm một danh mục mới chỉ cần khai báo endpoint và cột —
 * không phải lặp lại logic phân trang, tìm kiếm, trạng thái tải.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   endpoint: string,
 *   columns: Array<{ key: string, header: string, align?: 'left'|'right'|'center',
 *                    width?: string, render?: (row: any) => React.ReactNode }>,
 *   filters?: Record<string, any>,
 *   searchPlaceholder?: string,
 *   toolbar?: React.ReactNode,
 *   actions?: React.ReactNode,
 * }} props
 */
export default function ResourceListPage({
  title,
  description,
  endpoint,
  columns,
  filters,
  searchPlaceholder,
  toolbar,
  actions,
}) {
  const list = useResourceList(endpoint, { filters });

  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />

      {list.error && (
        <Alert className="mb-4" title="Không tải được dữ liệu">
          {list.error.message}
        </Alert>
      )}

      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-2">
            {toolbar}
            <Button variant="secondary" size="sm" onClick={list.refetch}>
              <Icon name="refresh" className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </div>

        <DataTable columns={columns} rows={list.rows} loading={list.isLoading} />

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
    </>
  );
}
