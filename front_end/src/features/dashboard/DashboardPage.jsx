import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/features/auth/AuthContext';
import http from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';

/** Một ô số liệu tổng quan. */
function StatTile({ icon, label, value, hint }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon name={icon} className="h-5 w-5 text-gray-300" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/**
 * Bảng điều khiển.
 *
 * GET /dashboard/summary trả về:
 * {
 *   stats: { receiptsThisMonth, revenueThisMonth, activePolicies, pendingDeclarations },
 *   recentActivities: [{ id, action, actor, createdAt }],
 *   badges: {...}, unreadNotifications: number
 * }
 */
export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => http.get(endpoints.dashboard.summary),
    staleTime: 5 * 60 * 1000,
  });

  const stats = data?.stats ?? {};

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description={user ? `Xin chào, ${user.name}.` : undefined}
      />

      {error && (
        <Alert className="mb-4" title="Không tải được số liệu tổng quan">
          {error.message}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon="receipt"
              label="Biên lai tháng này"
              value={formatNumber(stats.receiptsThisMonth)}
            />
            <StatTile
              icon="coin"
              label="Số tiền thu tháng này"
              value={formatCurrency(stats.revenueThisMonth)}
            />
            <StatTile
              icon="shield"
              label="Hồ sơ đang hiệu lực"
              value={formatNumber(stats.activePolicies)}
            />
            <StatTile
              icon="inbox"
              label="Hồ sơ chờ xử lý"
              value={formatNumber(stats.pendingDeclarations)}
              hint="D03 / D05 / AR chưa gửi cơ quan BHXH"
            />
          </div>

          <Card className="mt-4" title="Hoạt động gần đây" bodyClassName="p-0">
            {data?.recentActivities?.length ? (
              <ul className="divide-y divide-gray-100">
                {data.recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 px-4 py-3">
                    <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{activity.action}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {activity.actor} · {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="clock"
                title="Chưa có hoạt động"
                description="Các thao tác trên hệ thống sẽ được ghi lại tại đây."
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}
