import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
import InsuranceLookup from './InsuranceLookup';
import BusinessGuide from './BusinessGuide';

/**
 * Một ô số liệu tổng quan. Có `to` thì cả ô thành liên kết sang trang chi tiết,
 * vì đọc số xong người dùng thường muốn xem ngay danh sách phía sau.
 */
function StatTile({ icon, label, value, hint, to }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon name={icon} className="h-5 w-5 text-gray-300" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </>
  );

  const boxClass = 'block rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200';

  if (!to) return <div className={boxClass}>{content}</div>;

  return (
    <Link to={to} className={`${boxClass} transition-colors hover:bg-gray-50`}>
      {content}
    </Link>
  );
}

/** Bốn ô số liệu chính của kỳ hiện tại. */
function StatGrid({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon="receipt"
        label="Biên lai tháng này"
        value={formatNumber(stats.receiptsThisMonth)}
        to="/receipts"
      />
      <StatTile
        icon="coin"
        label="Số tiền thu tháng này"
        value={formatCurrency(stats.revenueThisMonth)}
        to="/payments"
      />
      <StatTile
        icon="shield"
        label="Hồ sơ đang hiệu lực"
        value={formatNumber(stats.activePolicies)}
        to="/insurance-history"
      />
      <StatTile
        icon="inbox"
        label="Hồ sơ chờ xử lý"
        value={formatNumber(stats.pendingDeclarations)}
        hint="D03 / D05 / AR chưa gửi cơ quan BHXH"
        to="/reports/summary"
      />
    </div>
  );
}

/** Nhật ký thao tác gần nhất trên hệ thống. */
function RecentActivities({ activities = [] }) {
  return (
    <Card
      title="Hoạt động gần đây"
      actions={
        <Link to="/audit-logs" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          Xem tất cả
        </Link>
      }
      bodyClassName="p-0"
    >
      {activities.length ? (
        <ul className="divide-y divide-gray-100">
          {activities.map((activity) => (
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
  );
}

/** Các việc hay làm nhất, đặt cạnh số liệu để bớt một lần đi qua thanh bên. */
const QUICK_ACTIONS = [
  { to: '/declarations/d03/import', label: 'Nhập D03', icon: 'inbox' },
  { to: '/declarations/d05/import', label: 'Nhập D05', icon: 'inbox' },
  { to: '/declarations/d03/export', label: 'Xuất D03', icon: 'upload' },
  { to: '/reports/summary', label: 'Báo cáo tổng hợp', icon: 'chart' },
];

function QuickActions() {
  return (
    <Card title="Tác vụ nhanh">
      <div className="grid gap-2 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Icon name={action.icon} className="h-4 w-4 text-gray-400" />
            {action.label}
          </Link>
        ))}
      </div>
    </Card>
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
        <div className="space-y-4">
          <StatGrid stats={data?.stats ?? {}} />

          <InsuranceLookup />

          {/* Hoạt động chiếm 2/3 chiều ngang, tác vụ nhanh nằm cột phải */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentActivities activities={data?.recentActivities} />
            </div>
            <QuickActions />
          </div>

          <BusinessGuide />
        </div>
      )}
    </>
  );
}
