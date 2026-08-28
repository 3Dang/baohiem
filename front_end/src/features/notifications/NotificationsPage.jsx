import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import clsx from 'clsx';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatDateTime } from '@/lib/format';

/**
 * Danh sách thông báo hệ thống.
 *
 * GET  /notifications        → `{ data: [{ id, title, body, readAt, createdAt }] }`
 * POST /notifications/read-all → 204
 */
export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [endpoints.notifications.list],
    queryFn: () => http.get(endpoints.notifications.list),
  });

  const markAllRead = useMutation({
    mutationFn: () => http.post(endpoints.notifications.markAllRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.notifications.list] });
      // Badge số chưa đọc nằm trong dashboard summary nên phải làm mới cùng lúc
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });

  const items = data?.data ?? [];
  const hasUnread = items.some((item) => !item.readAt);

  return (
    <>
      <PageHeader
        title="Thông báo"
        actions={
          hasUnread && (
            <Button
              variant="secondary"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              <Icon name="check" className="h-4 w-4" />
              Đánh dấu đã đọc tất cả
            </Button>
          )
        }
      />

      <Card bodyClassName="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Spinner className="h-8 w-8" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon="bell" title="Không có thông báo" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li
                key={item.id}
                // Thông báo chưa đọc được tô nền nhạt để nổi bật trong danh sách
                className={clsx('flex items-start gap-3 px-4 py-3', !item.readAt && 'bg-brand-50/50')}
              >
                <Icon
                  name="bell"
                  className={clsx('mt-0.5 h-4 w-4 shrink-0', item.readAt ? 'text-gray-300' : 'text-brand-600')}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  {item.body && <p className="mt-0.5 text-sm text-gray-600">{item.body}</p>}
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
